import { toast } from "react-toastify"

export const getLocaleString = (value) => {
    if (!value) {
        return "-"
    } else {
        return new Date(value).toLocaleString("en-US", {
            timeZone: "Asia/Taipei",
        })
    }
}

export const toastSuccess = (message) => {
    toast.success(message, {
        position: "bottom-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    })
}

export const toastError = (message) => {
    toast.error(message, {
        position: "bottom-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    })
}
