import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";

var imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
});
export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    try {
        const upload = await imagekit.upload({
            file: buffer,
            fileName: Date.now().toString() + '.pdf',
            folder: "/intervie/",
            isPublished: true
        });
        return NextResponse.json({ url: upload.url });
    } catch (error) {

    }

}