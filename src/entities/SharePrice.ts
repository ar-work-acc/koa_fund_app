import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
} from "typeorm"
import Fund from "./Fund"

/**
 * Share price per unit of a mutal fund at a specific time.
 */
@Entity()
export default class SharePrice extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: "timestamptz", nullable: true })
  date!: Date

  @Column({ type: "double precision", default: 0.0 })
  value!: number

  @ManyToOne(() => Fund, (fund) => fund.sharePrices, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  fund!: Fund
}
