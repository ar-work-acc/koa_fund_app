import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    Index,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm"
import Order from "./Order"
import SharePrice from "./SharePrice"

export enum FundType {
    NORMAL = 0, // pays trading fee with share
    PREPAY_TRADING_FEE = 1, // trading fee has to be pre-paid
}

/**
 * Mutual fund.
 */
@Entity()
class Fund extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ length: 255 })
    name!: string

    @Column({ type: "smallint", default: FundType.NORMAL })
    type!: FundType

    @Column({ type: "double precision", default: 0.015 })
    tradingFee!: number

    @Column({ default: "(fund prospectus)" })
    prospectus!: string

    @OneToMany(() => Order, (order) => order.fund, { cascade: true })
    orders!: Order[]

    @OneToMany(() => SharePrice, (sharePrice) => sharePrice.fund, {
        cascade: true,
    })
    sharePrices!: SharePrice[]
}

export default Fund
