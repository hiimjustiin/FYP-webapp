import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import Button from "./button";

export default {
    title: "Components/Button/Alert",
    component: Button,
};

export const Red = () => <Button variant="red">OK</Button>;
export const Grey = () => <Button variant="grey">Cancel</Button>;
export const Green = () => <Button variant="green">OK</Button>;
