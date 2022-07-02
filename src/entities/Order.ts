import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    Index,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
} from "typeorm"
import Account from "./Account"
import Fund from "./Fund"

export enum OrderStatus {
    ORDERED = 0,
    PURCHASED = 1,
    CANCELED = 2,
}

/**
 * Mutual fund orders the user placed.
*/
@Entity()
export default class Order extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @ManyToOne(() => Account, (account) => account.orders, {
        nullable: false,
        onDelete: "CASCADE",
        orphanedRowAction: "delete",
    })
    account!: Account

    @ManyToOne(() => Fund, (fund) => fund.orders, {
        nullable: false,
        onDelete: "CASCADE",
        orphanedRowAction: "delete",
    })
    fund!: Fund

    // renamed to amount: when status = ORDERED, it means amount ordered; when status = PURCHASED, it means amount purchased
    @Column({ type: "double precision", default: 0.0 })
    amount!: number

    @Column({ type: "double precision", default: 0.0 })
    sharesBought!: number

    @Column({ type: "smallint", default: OrderStatus.ORDERED })
    status!: number

    @Column({ type: "timestamptz" })
    orderedAt!: Date

    @Column({ type: "timestamptz", nullable: true })
    processedAt!: Date
}
