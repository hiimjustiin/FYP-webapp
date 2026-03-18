import {
  feedbackService,
  type FeedbackResponse,
} from "./feedbackService";

export type SubmissionProcessingTerminalStatus =
  | "completed"
  | "failed"
  | "timeout";

export interface WaitForSubmissionProcessingResult {
  status: SubmissionProcessingTerminalStatus;
  feedback?: FeedbackResponse;
}

interface WaitForSubmissionProcessingOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
  requestTimeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_POLL_INTERVAL_MS = 3000;
const DEFAULT_REQUEST_TIMEOUT_MS = 8000;

const wait = async (durationMs: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
};

export const waitForSubmissionProcessing = async (
  submissionId: string,
  options: WaitForSubmissionProcessingOptions = {},
): Promise<WaitForSubmissionProcessingResult> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const requestTimeoutMs =
    options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const feedback = (await Promise.race([
        feedbackService.getFeedback(submissionId),
        wait(requestTimeoutMs).then(() => null),
      ])) as FeedbackResponse | null;

      if (!feedback) {
        console.warn(
          "[submissionProcessingService] Poll request timed out, retrying...",
        );
        const elapsedMs = Date.now() - startedAt;
        const remainingMs = timeoutMs - elapsedMs;
        if (remainingMs <= 0) {
          break;
        }
        await wait(Math.min(pollIntervalMs, remainingMs));
        continue;
      }

      const processingStatus = feedback.submission.ai_processing_status;

      if (processingStatus === "completed") {
        return { status: "completed", feedback };
      }

      if (processingStatus === "failed") {
        return { status: "failed", feedback };
      }
    } catch (error) {
      console.error(
        "[submissionProcessingService] Failed to poll submission status:",
        error,
      );
    }

    const elapsedMs = Date.now() - startedAt;
    const remainingMs = timeoutMs - elapsedMs;
    if (remainingMs <= 0) {
      break;
    }

    await wait(Math.min(pollIntervalMs, remainingMs));
  }

  return { status: "timeout" };
};
