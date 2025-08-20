// app/scan/[id]/page.js
'use client';
import { useParams } from 'next/navigation';
import QRScanPage from '@/app/pages/scanpage';

export default function scan() {
    const { id } = useParams();
    return (
        <div>
            <QRScanPage id={id} />
        </div>
    );
}