export default function ErrorPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const msg = searchParams.msg

    let title = "Access Denied"
    let description = "An error occurred while accessing the content."

    if (msg === 'invalid_tag') {
        description = "The NFC tag data is invalid or could not be verified."
    } else if (msg === 'replay_detected') {
        title = "Replay Detected"
        description = "This URL has already been used. Please tap the NFC tag again."
    } else if (msg === 'tag_not_found') {
        description = "The requested tag does not exist."
    } else if (msg === 'missing_params') {
        description = "Invalid link. Please tap the NFC tag correctly."
    } else if (msg === 'session_expired') {
        title = "Session Expired"
        description = "Your playback session has expired. Please tap the NFC tag again."
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md text-center">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">{title}</h1>
                <p className="text-lg text-slate-600 mb-8">{description}</p>
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                    <p className="text-sm text-blue-800">
                        Tip: Make sure you are tapping the actual NFC tag and not using a saved link.
                    </p>
                </div>
            </div>
        </div>
    )
}
