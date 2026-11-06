// Red box for errors, light box for information. Renders nothing when empty.
const FormMessage = ({ error, info }: { error?: string; info?: string }) => {
    if (error) {
        return <p role="alert" className="formError">{error}</p>;
    }
    if (info) {
        return <p role="status" className="formInfo">{info}</p>;
    }
    return null;
}

export default FormMessage;
