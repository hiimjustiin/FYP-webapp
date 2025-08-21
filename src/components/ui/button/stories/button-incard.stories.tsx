import "../../../../assets/fonts/typography.css";
import "../../../../assets/fonts/fonts.css";
import "../../../../assets/colors/colors.css";
import "../../../../../src/index.css";

import Button from "../button";
import ChevronRight from "../../../../assets/icons/chevron_right.svg";
import ChevronLeft from "../../../../assets/icons/chevron_left.svg";
import ChevronDown from "../../../../assets/icons/chevron_down.svg";
import ChevronUp from "../../../../assets/icons/chevron_up.svg";

export default {
  title: "Components/Button/In-card",
  component: Button,
};

export const CollapseRight = () => (
  <Button variant="whiteCard" className="pl-4 pr-2">
    Collapse
    <img src={ChevronRight} alt="Chevron Right" className="w-8 h-8" />
  </Button>
);

export const LeftIcon = () => (
  <Button variant="whiteCard">
    <img src={ChevronLeft} alt="Chevron Left" className="w-8 h-8" />
  </Button>
);

export const ExpandDown = () => (
  <Button variant="whiteCard" className="pl-4 pr-2">
    Expand
    <img src={ChevronDown} alt="Chevron Down" className="w-8 h-8" />
  </Button>
);

export const CollapseUp = () => (
  <Button variant="whiteCard" className="pl-4 pr-2">
    Collapse
    <img src={ChevronUp} className="w-8 h-8" />
  </Button>
);
