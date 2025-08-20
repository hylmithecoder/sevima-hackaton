"use client";
import { useSearchParams } from 'next/navigation';
// import Navbar from "../components/navbar";
import UserManagementPanel from '../pages/users';
import SideBar from "../components/sidebar";
import AddQRCodePanel from '../pages/qrcode';
import AttendanceDashboard from '../pages/dashboard';
import ExportToPDF from '../pages/exporttopdf';
// import ChatBot from '../components/chatbot';

export default function DynamicHome() {
    const searchParams = useSearchParams();
    const page = searchParams.get('modul');

    let Content;
    switch (page) {
        case "qr_code":
            Content = <AddQRCodePanel/>;
            break;
        case "user":
            Content = <UserManagementPanel/>
            break;
        case "laporan":
            Content = <ExportToPDF/>
            break;
        default:
            Content = <AttendanceDashboard/>;
    }

    return (
        <div>
            <SideBar />
            {Content}
        </div>
    );
}