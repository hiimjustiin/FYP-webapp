import "./typography.css";
import "./fonts.css";
import "../colors/colors.css";

import "../../../src/index.css";

export default {
    title: "Design System/Typography",
};

export const AllTypography = () => (
    <section className="border-2 p-4">
        <h2 className="mb-4 text-2xl font-bold underline">
            Typography Preview
        </h2>
        <div>
            <div className="heading-1 mb-2">Heading 1</div>
            <div className="heading-2 mb-2">Heading 2</div>
            <div className="heading-3 mb-2">Heading 3</div>
            <div className="heading-4 mb-2">Heading 4</div>
            <div className="heading-5 mb-2">Heading 5</div>
            <div className="heading-6 mb-2">Heading 6</div>
            <div className="subtitle-1 mb-2">Subtitle 1</div>
            <div className="subtitle-2 mb-2">Subtitle 2</div>
            <div className="subtitle-3 mb-2">Subtitle 3</div>
            <div className="body-1 mb-2">Body 1</div>
            <div className="body-2 mb-2">Body 2</div>
            <div className="button mb-2">Button</div>
            <div className="caption mb-2">Caption</div>
            <div className="overline mb-2">Overline</div>
            <div className="monospace mb-2">Monospace</div>
            <div className="sublabel mb-2">Sublabel</div>
        </div>
    </section>
);

export const Headings = () => (
    <div>
        <div className="heading-1 mb-4">Heading 1 - Main</div>
        <div className="heading-2 mb-4">Heading 2 - Section Title</div>
        <div className="heading-3 mb-4">Heading 3 - Subsection</div>
        <div className="heading-4 mb-4">Heading 4 - Medium Title</div>
        <div className="heading-5 mb-4">Heading 5 - Small Title</div>
        <div className="heading-6 mb-4">Heading 6 - Smallest Title</div>
    </div>
);

export const Subtitles = () => (
    <div>
        <div className="subtitle-1 mb-4">Subtitle 1 - Large supporting text</div>
        <div className="subtitle-2 mb-4">Subtitle 2 - Medium supporting text</div>
        <div className="subtitle-3 mb-4">Subtitle 3 - Small supporting text</div>
    </div>
);

export const BodyText = () => (
    <div>
        <div className="body-1 mb-4">
            Body 1 - Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            This is the primary body text style used for main content.
        </div>
        <div className="body-2 mb-4">
            Body 2 - Smaller body text for secondary content areas and 
            detailed descriptions.
        </div>
    </div>
);

export const SpecialText = () => (
    <div>
        <div className="button mb-4">Button Text Style</div>
        <div className="caption mb-4">Caption - For image captions and small notes</div>
        <div className="overline mb-4">OVERLINE - FOR SECTION LABELS</div>
        <div className="monospace mb-4">Monospace - For code and technical content</div>
        <div className="sublabel mb-4">Sublabel - For the smallest text elements</div>
    </div>
);

export const InContext = () => (
    <div className="space-y-6">
        <article>
            <h1 className="heading-1 mb-2">Article Title</h1>
            <div className="subtitle-1 mb-4">This is a subtitle explaining the article</div>
            <p className="body-1 mb-4">
                This is the main body text. Lorem ipsum dolor sit amet, consectetur 
                adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p className="body-2 mb-2">
                This is secondary body text, often used for less important content.
            </p>
            <div className="caption">Caption text for additional context</div>
        </article>
        
        <div>
            <div className="overline mb-1">SECTION LABEL</div>
            <h2 className="heading-3 mb-2">Section Heading</h2>
            <code className="monospace">const example = "code snippet";</code>
        </div>
    </div>
);
