package com.finance.app.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.finance.app.domain.enumeration.DiscountKind;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A PurchaseLine.
 */
@Entity
@Table(name = "purchase_line")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PurchaseLine implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Size(max = 200)
    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "qty", precision = 21, scale = 2, nullable = false)
    private BigDecimal qty;

    @NotNull
    @Size(max = 20)
    @Column(name = "unit", length = 20, nullable = false)
    private String unit;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "rate", precision = 21, scale = 2, nullable = false)
    private BigDecimal rate;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "discount_kind", nullable = false)
    private DiscountKind discountKind;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "discount_value", precision = 21, scale = 2, nullable = false)
    private BigDecimal discountValue;

    @NotNull
    @DecimalMin(value = "0")
    @DecimalMax(value = "100")
    @Column(name = "tax_percent", precision = 21, scale = 2, nullable = false)
    private BigDecimal taxPercent;

    @Min(value = 0)
    @Column(name = "line_order")
    private Integer lineOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "business" }, allowSetters = true)
    private Item item;

    @ManyToOne(optional = false)
    @NotNull
    @JsonIgnoreProperties(value = { "lineses", "business", "party" }, allowSetters = true)
    private Purchase purchase;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public PurchaseLine id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return this.name;
    }

    public PurchaseLine name(String name) {
        this.setName(name);
        return this;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getQty() {
        return this.qty;
    }

    public PurchaseLine qty(BigDecimal qty) {
        this.setQty(qty);
        return this;
    }

    public void setQty(BigDecimal qty) {
        this.qty = qty;
    }

    public String getUnit() {
        return this.unit;
    }

    public PurchaseLine unit(String unit) {
        this.setUnit(unit);
        return this;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getRate() {
        return this.rate;
    }

    public PurchaseLine rate(BigDecimal rate) {
        this.setRate(rate);
        return this;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public DiscountKind getDiscountKind() {
        return this.discountKind;
    }

    public PurchaseLine discountKind(DiscountKind discountKind) {
        this.setDiscountKind(discountKind);
        return this;
    }

    public void setDiscountKind(DiscountKind discountKind) {
        this.discountKind = discountKind;
    }

    public BigDecimal getDiscountValue() {
        return this.discountValue;
    }

    public PurchaseLine discountValue(BigDecimal discountValue) {
        this.setDiscountValue(discountValue);
        return this;
    }

    public void setDiscountValue(BigDecimal discountValue) {
        this.discountValue = discountValue;
    }

    public BigDecimal getTaxPercent() {
        return this.taxPercent;
    }

    public PurchaseLine taxPercent(BigDecimal taxPercent) {
        this.setTaxPercent(taxPercent);
        return this;
    }

    public void setTaxPercent(BigDecimal taxPercent) {
        this.taxPercent = taxPercent;
    }

    public Integer getLineOrder() {
        return this.lineOrder;
    }

    public PurchaseLine lineOrder(Integer lineOrder) {
        this.setLineOrder(lineOrder);
        return this;
    }

    public void setLineOrder(Integer lineOrder) {
        this.lineOrder = lineOrder;
    }

    public Item getItem() {
        return this.item;
    }

    public void setItem(Item item) {
        this.item = item;
    }

    public PurchaseLine item(Item item) {
        this.setItem(item);
        return this;
    }

    public Purchase getPurchase() {
        return this.purchase;
    }

    public void setPurchase(Purchase purchase) {
        this.purchase = purchase;
    }

    public PurchaseLine purchase(Purchase purchase) {
        this.setPurchase(purchase);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PurchaseLine)) {
            return false;
        }
        return getId() != null && getId().equals(((PurchaseLine) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PurchaseLine{" +
            "id=" + getId() +
            ", name='" + getName() + "'" +
            ", qty=" + getQty() +
            ", unit='" + getUnit() + "'" +
            ", rate=" + getRate() +
            ", discountKind='" + getDiscountKind() + "'" +
            ", discountValue=" + getDiscountValue() +
            ", taxPercent=" + getTaxPercent() +
            ", lineOrder=" + getLineOrder() +
            "}";
    }
}
