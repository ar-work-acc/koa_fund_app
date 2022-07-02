import React from "react"
import { Link } from "react-router-dom"
import { useGetFundListQuery } from "./sliceFund"

export const FundList = () => {
    const { data: { funds, count } = { funds: [], count: 0 }, isSuccess } =
        useGetFundListQuery({
            page: 1,
            pageSize: 1000,
        })

    return (
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">
                    Fund List (total number of funds: {count})
                </h1>
            </div>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th scope="col" className="col-md-1">
                            ID
                        </th>
                        <th scope="col" className="col-md-2">
                            Mutual Fund Name
                        </th>
                        <th scope="col" className="col-md-2">
                            Type
                        </th>
                        <th scope="col" className="col-md-2">
                            Trading Fee
                        </th>
                        <th scope="col" className="col-md-3">
                            Prospectus
                        </th>
                        <th scope="col" className="col-md-2">
                            Actions
                        </th>
                    </tr>
                </thead>

                {isSuccess ? (
                    <tbody>
                        {funds.map((fund) => {
                            return (
                                <React.Fragment key={fund.id}>
                                    <tr>
                                        <td>{fund.id}</td>
                                        <td>{fund.name}</td>
                                        <td>
                                            {fund.type
                                                ? "prepay trading fee"
                                                : "normal"}
                                        </td>
                                        <td>{fund.tradingFee * 100} %</td>
                                        <td>{fund.prospectus}</td>
                                        <td>
                                            <Link to={`/funds/${fund.id}`}>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                >
                                                    See #{fund.id}
                                                </button>
                                            </Link>
                                        </td>
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
