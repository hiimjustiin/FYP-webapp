import Button from "./button";
import GoogleIcon from "../../../assets/icons/google_icon.svg";
import ChevronRight from "../../../assets/icons/chevron_right.svg";
import ChevronLeft from "../../../assets/icons/chevron_left.svg";
import ChevronDown from "../../../assets/icons/chevron_down.svg";
import ChevronUp from "../../../assets/icons/chevron_up.svg";

const ButtonsPreview = () => {
    return (
        <section className="flex-col border-2 p-4">
            <h2 className="mb-4 text-2xl font-bold underline">
                Buttons Preview
            </h2>
            <div className="mb-4">
                <h5 className="mb-2">Alert Buttons</h5>
                <div className="flex gap-2">
                    <Button variant="red">OK</Button>
                    <Button variant="grey">Cancel</Button>
                    <Button variant="green">OK</Button>
                </div>
            </div>
            <div className="mb-4">
                <h5 className="mb-2">Buttons</h5>
                <div className="flex flex-wrap gap-2">
                    <Button variant="red">Submit</Button>
                    <Button variant="blue">Full Report</Button>
                    <Button variant="green">Send</Button>
                    <Button variant="purple">Draft</Button>
                    <Button variant="blue">Return To Edit</Button>
                    <Button variant="blue">Edit</Button>
                </div>
            </div>
            <div className="mb-4">
                <h5 className="mb-2">In-card Buttons</h5>
                <div className="flex gap-2">
                    <Button variant="whiteCard" className="pl-4 pr-2">
                        Collapse
                        <img src={ChevronRight} className="w-8 h-8"/>
                    </Button>
                    <Button variant="whiteCard">
                        <img src={ChevronLeft} className="w-8 h-8"/>
                    </Button>
                    <Button variant="whiteCard" className="pl-4 pr-2">
                        Expand
                        <img src={ChevronDown} className="w-8 h-8"/>
                    </Button>
                    <Button variant="whiteCard" className="pl-4 pr-2">
                        Collapse
                        <img src={ChevronUp} className="w-8 h-8"/>
                    </Button>
                </div>
            </div>
            <div className="mb-4">
                <h5 className="mb-2">Login Buttons</h5>
                <div className="flex flex-col gap-2">
                    <Button variant="darkBlue" className="w-90">Login Now</Button>
                    <Button variant="white" className="flex gap-3 w-90">
                        <img src={GoogleIcon} alt="Google Icon" className="w-6 h-6"/>
                        Login with Google
                    </Button>
                    <Button variant="white" className="flex gap-3 w-90">
                        <img src={GoogleIcon} alt="Google Icon" className="w-6 h-6"/>
                        Sign up with Google
                    </Button>
                    <Button variant="darkBlue" className="w-90">Sign Up</Button>
                    <Button variant="darkBlue" className="w-90">Send Password Reset Link</Button>
                </div>
            </div>
        </section>
    );
}

export default ButtonsPreview;
