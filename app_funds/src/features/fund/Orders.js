import React from "react"
import { useGetOrderListQuery } from "./sliceFund"
import { getLocaleString } from "../common/util"
import classNames from "classnames"
import { useGetAccountInfoQuery } from "../api/sliceAPI"
import { sliceFund } from "./sliceFund"
import { useDispatch } from "react-redux"

export const Orders = () => {
    const dispatch = useDispatch()

    const { data: accountInfo, isSuccess: isAccountQuerySuccess } =
        useGetAccountInfoQuery(null)

    const { data: { orders, count } = { orders: [], count: 0 }, isSuccess } =
        useGetOrderListQuery(
            {
                page: 1,
                pageSize: 1000,
                userId: accountInfo.id,
            },
            { skip: !isAccountQuerySuccess }
        )

    const refreshOrders = () => {
        dispatch(sliceFund.util.invalidateTags([{ type: "Order", id: "list" }]))
    }

    return (
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Your Orders (total: {count} orders)</h1>
                <div className="btn-toolbar mb-2 mb-md-0">
                    <div className="btn-group me-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={refreshOrders}
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th scope="col" className="col-md-1">
                            ID
                        </th>
                        <th scope="col" className="col-md-1">
                            Amount Ordered
                        </th>
                        <th scope="col" className="col-md-1">
                            Shares
                        </th>
                        <th scope="col" className="col-md-1">
                            Status
                        </th>
                        <th scope="col" className="col-md-2">
                            Ordered At
                        </th>
                        <th scope="col" className="col-md-2">
                            Processed At
                        </th>
                        <th scope="col" className="col-md-4">
                            Fund
                        </th>
                    </tr>
                </thead>

                {isSuccess ? (
                    <tbody>
                        {orders.map((order) => {
                            let orderStatus = ""
                            switch (order.status) {
                                case 0:
                                    orderStatus = "ordered"
                                    break
                                case 1:
                                    orderStatus = "purchased"
                                    break
                                case 2:
                                    orderStatus = "canceled"
                                    break
                                default:
                                    break
                            }
                            return (
                                <React.Fragment key={order.id}>
                                    <tr
                                        className={classNames({
                                            "table-info": order.status === 0,
                                            "table-success": order.status === 1,
                                            "table-warning": order.status === 2,
                                        })}
                                    >
                                        <td>{order.id}</td>
                                        <td>
                                            {parseFloat(order.amount).toFixed(
                                                6
                                            ) / 1}
                                        </td>
                                        <td>
                                            {parseFloat(
                                                order.sharesBought
                                            ).toFixed(6) / 1}
                                        </td>
                                        <td>{orderStatus}</td>
                                        <td>
                                            {getLocaleString(order.orderedAt)}
                                        </td>
                                        <td>
                                            {getLocaleString(order.processedAt)}
                                        </td>
                                        <td>{order.fund.name}</td>
                                    </tr>
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                ) : (
                    ""
                )}
            </table>
        </main>
    )
}
