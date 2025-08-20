import AuthProvider from "../components/middleware";
import MobilePage from "../pages/mobilepage";

export default function Mobile() {
    return (
    <div>
        <AuthProvider>
        <MobilePage />
        </AuthProvider>
    </div>
    )
}