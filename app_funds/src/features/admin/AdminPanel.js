import React from "react"
import {
    useCreateSharePriceMutation,
    useProcessOrdersMutation,
} from "./sliceAdmin"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { toastSuccess, toastError } from "../common/util"

export const AdminPanel = () => {
    const [fundId, setFundId] = React.useState(1)
    const [value, setValue] = React.useState(1)
    const [createSharePrice] = useCreateSharePriceMutation()
    const submitFormCreateSharePrice = async () => {
        console.log(`Fund ID: ${fundId}, value: ${value}`)
        try {
            await createSharePrice({
                fundId,
                value,
            }).unwrap()
            toastSuccess("SUCCESS: share price created!")
        } catch (error) {
            toastError("ERROR: can't create new shared price!")
        }
    }
    const [processOrders] = useProcessOrdersMutation()
    const submitFormProcessOrders = async () => {
        console.log(`Process orders...`)
        try {
            await processOrders().unwrap()
            toastSuccess("SUCCESS: order processed!")
        } catch (error) {
            toastError("ERROR: can't process orders!")
        }
    }

    return (
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Admin Panel</h1>
            </div>
            <ToastContainer />
            <div className="row">
                <div className="col-md-4">
                    <button
                        type="button"
                        className="btn btn-warning"
                        onClick={submitFormCreateSharePrice}
                    >
                        Create New Share Price
                    </button>
                </div>
                <div className="col-md-4">
                    <select
                        className="form-select mb-1"
                        value={fundId}
                        onChange={(e) => {
                            setFundId(e.target.value)
                        }}
                    >
                        <option value="1">Fund #1</option>
                        <option value="2">Fund #2</option>
                    </select>
                </div>
                <div className="col-md-4">
                    <input
                        className="form-control mb-1"
                        type="number"
                        min={0}
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value)
                        }}
                    ></input>
                </div>
            </div>
            <hr />
            <button
                type="button"
                className="btn btn-warning"
                onClick={submitFormProcessOrders}
            >
                Process First 10 Orders
            </button>
        </main>
    )
}
