import React from "react"
import { sliceFund } from "./sliceFund"
import { Link, useParams } from "react-router-dom"
import {
    useGetFundQuery,
    useCreateOrderMutation,
    useGetExchangeRateQuery,
} from "./sliceFund"
import { getLocaleString } from "../common/util"
import { ToastContainer, toast } from "react-toastify"
import { useDispatch } from "react-redux"
import "react-toastify/dist/ReactToastify.css"
import classNames from "classnames"

export const FundDetail = () => {
    let { id } = useParams()

    const { data: { fund } = { fund: {} }, isSuccess } = useGetFundQuery(id)

    const [amount, setAmount] = React.useState(1)
    const [currency, setCurrency] = React.useState("usd")
    const { data = { rate: 1 }, isSuccess: isSuccessGetCurrency } =
        useGetExchangeRateQuery({ currency })
    console.log("exchange rate:", data)

    const dispatch = useDispatch()
    const [createOrder] = useCreateOrderMutation()
    const submitOrderForm = async () => {
        console.log(`Placing order, amount = ${amount}, currency = ${currency}`)
        try {
            const { message = "" } = await createOrder({
                fundId: id,
                amount,
                currency,
            }).unwrap()
            console.log("success", message)
            toast.success(message, {
                position: "bottom-right",
                autoClose: 1000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            })
        } catch (error) {
            const errorMessage = error?.data?.message
            console.log("error", errorMessage)
            toast.error(errorMessage, {
                position: "bottom-right",
                autoClose: 1000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            })
        }
        // to update balance:
        dispatch(sliceFund.util.invalidateTags([{ type: "User", id: "login" }]))

        setAmount(1)
        setCurrency("usd")
    }

    let reversedSharePrices = []
    if (isSuccess && fund?.sharePrices?.length) {
        reversedSharePrices = structuredClone(fund.sharePrices).reverse()
    }

    return (
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Fund Detail: {id}</h1>
                <div className="btn-toolbar mb-2 mb-md-0">
                    <div className="btn-group me-2">
                        <Link to={"/funds"}>
                            <button type="button" className="btn btn-primary">
                                Back to Funds
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
            <ToastContainer />
            {isSuccess ? (
                <React.Fragment>
                    <h2>{fund.name}</h2>
                    <p>
                        Type: {fund.type ? "prepay trading fee" : "normal"}
                        {"  "}(trading fee: {fund.tradingFee * 100}%)
                    </p>
                    <h3>Prospectus</h3>
                    <p>{fund.prospectus}</p>

                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <select
                                className="form-select mb-1"
                                value={currency}
                                onChange={(e) => {
                                    setCurrency(e.target.value)
                                }}
                            >
                                <option value="usd">USD</option>
                                <option value="ntd">NTD</option>
                                <option value="euro">Euro</option>
                            </select>
                        </div>
                        <div className="col-md-4 mb-3">
                            <input
                                className="form-control mb-1"
                                type="number"
                                min={1}
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value)
                                }}
                            ></input>
                        </div>
                        <div className="col-md-4 ">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={submitOrderForm}
                            >
                                Order Fund
                            </button>
                        </div>
                    </div>

                    <hr />
                    <table className="table" key={currency}>
                        <thead>
                            <tr>
                                <th scope="col" className="col-md-4">
                                    ID
                                </th>
                                <th scope="col" className="col-md-4">
                                    Date
                                </th>
                                <th scope="col" className="col-md-4">
                                    Share Price per Unit (
                                    {currency.toUpperCase()})
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {reversedSharePrices.map((sharePrice, index) => {
                                return (
                                    <tr
                                        key={sharePrice.id}
                                        className={classNames({
                                            "table-info": index === 0,
                                        })}
                                    >
                                        <td>{sharePrice.id}</td>
                                        <td>
                                            {getLocaleString(sharePrice.date)}
                                        </td>
                                        <td>
                                            {currency === "usd" ||
                                            isSuccessGetCurrency
                                                ? parseFloat(
                                                      sharePrice.value *
                                                          data.rate
                                                  ).toFixed(3) / 1
                                                : "retrieving..."}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </React.Fragment>
            ) : (
                ""
            )}
        </main>
    )
}
