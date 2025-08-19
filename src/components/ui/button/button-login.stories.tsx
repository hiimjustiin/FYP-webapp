import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import Button from "./button";
import GoogleIcon from "../../../assets/icons/google_icon.svg";

export default {
    title: "Components/Button/Login",
    component: Button,
};

export const DarkBlue = () => <Button variant="darkBlue" className="w-90">Login Now</Button>;

export const WithIcon = () => (
    <Button variant="white" className="flex gap-3 w-90">
        <img src={GoogleIcon} alt="Google Icon" className="w-6 h-6"/>
        Login with Google
    </Button>
);

export const White = () => (
    <Button variant="white" className="w-90">
        Sign up with Google
    </Button>
);