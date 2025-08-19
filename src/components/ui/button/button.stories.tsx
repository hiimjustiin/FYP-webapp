import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import Button from "./button";

export default {
    title: "Components/Button",
    component: Button,
};
export const Red = () => <Button variant="red">Submit</Button>;
export const Grey = () => <Button variant="grey">Cancel</Button>;
export const Green = () => <Button variant="green">Send</Button>;
export const Blue = () => <Button variant="blue">Full Report</Button>;
export const DarkBlue = () => <Button variant="darkBlue">Button</Button>;
export const Purple = () => <Button variant="purple">Draft</Button>;
export const White = () => <Button variant="white">Sign up</Button>;
