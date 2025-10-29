import Button from "../../ui/Button/Button";
import DimensionLabel from "../../ui/DimensionLabel/DimensionLabel";
import type { Dimension } from "../../../services/dimensionsService";

interface DimensionSelectorProps {
  dimensions: Dimension[];
  selectedDimIds: string[];
  onToggleDim: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const DimensionSelector = ({
  dimensions,
  selectedDimIds,
  onToggleDim,
  onSelectAll,
  onClearAll,
}: DimensionSelectorProps) => {
  return (
    <div className="rounded-2xl border border-[var(--color-grey-25)] bg-[var(--color-grey-05)]/40 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="subtitle-2">Select Dimensions</div>
        <div className="flex items-center gap-3">
          <Button variant="green" onClick={onSelectAll}>
            Select All
          </Button>
          <Button variant="grey" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Dimension chips */}
      <div className="flex flex-wrap gap-2">
        {dimensions.map((d) => {
          const isSelected = selectedDimIds.includes(d.id.toString());
          return (
            <DimensionLabel
              key={d.id}
              text={d.label}
              variant={d.variant}
              size="small"
              isSelected={isSelected}
              onClick={() => onToggleDim(d.id.toString())}
            />
          );
        })}
      </div>

      {/* Counter */}
      <div className="mt-2">
        <p className="caption">
          {selectedDimIds.length} of {dimensions.length} dimensions selected
        </p>
      </div>
    </div>
  );
};
