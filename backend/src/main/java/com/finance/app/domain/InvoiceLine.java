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
 * A InvoiceLine.
 */
@Entity
@Table(name = "invoice_line")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class InvoiceLine implements Serializable {

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

    @Size(max = 120)
    @Column(name = "item_code", length = 120)
    private String itemCode;

    @Size(max = 60)
    @Column(name = "hsn_sac", length = 60)
    private String hsnSac;

    @Size(max = 120)
    @Column(name = "category", length = 120)
    private String category;

    @Size(max = 120)
    @Column(name = "challan_order_no", length = 120)
    private String challanOrderNo;

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

    @DecimalMin(value = "0")
    @Column(name = "tax_amount", precision = 21, scale = 2)
    private BigDecimal taxAmount;

    @Size(max = 80)
    @Column(name = "transaction_type", length = 80)
    private String transactionType;

    @DecimalMin(value = "0")
    @Column(name = "line_amount", precision = 21, scale = 2)
    private BigDecimal lineAmount;

    @Min(value = 0)
    @Column(name = "line_order")
    private Integer lineOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "business" }, allowSetters = true)
    private Item item;

    @ManyToOne(optional = false)
    @NotNull
    @JsonIgnoreProperties(value = { "lineses", "business", "party" }, allowSetters = true)
    private Invoice invoice;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public InvoiceLine id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return this.name;
    }

    public InvoiceLine name(String name) {
        this.setName(name);
        return this;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getItemCode() {
        return this.itemCode;
    }

    public InvoiceLine itemCode(String itemCode) {
        this.setItemCode(itemCode);
        return this;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public String getHsnSac() {
        return this.hsnSac;
    }

    public InvoiceLine hsnSac(String hsnSac) {
        this.setHsnSac(hsnSac);
        return this;
    }

    public void setHsnSac(String hsnSac) {
        this.hsnSac = hsnSac;
    }

    public String getCategory() {
        return this.category;
    }

    public InvoiceLine category(String category) {
        this.setCategory(category);
        return this;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getChallanOrderNo() {
        return this.challanOrderNo;
    }

    public InvoiceLine challanOrderNo(String challanOrderNo) {
        this.setChallanOrderNo(challanOrderNo);
        return this;
    }

    public void setChallanOrderNo(String challanOrderNo) {
        this.challanOrderNo = challanOrderNo;
    }

    public BigDecimal getQty() {
        return this.qty;
    }

    public InvoiceLine qty(BigDecimal qty) {
        this.setQty(qty);
        return this;
    }

    public void setQty(BigDecimal qty) {
        this.qty = qty;
    }

    public String getUnit() {
        return this.unit;
    }

    public InvoiceLine unit(String unit) {
        this.setUnit(unit);
        return this;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getRate() {
        return this.rate;
    }

    public InvoiceLine rate(BigDecimal rate) {
        this.setRate(rate);
        return this;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public DiscountKind getDiscountKind() {
        return this.discountKind;
    }

    public InvoiceLine discountKind(DiscountKind discountKind) {
        this.setDiscountKind(discountKind);
        return this;
    }

    public void setDiscountKind(DiscountKind discountKind) {
        this.discountKind = discountKind;
    }

    public BigDecimal getDiscountValue() {
        return this.discountValue;
    }

    public InvoiceLine discountValue(BigDecimal discountValue) {
        this.setDiscountValue(discountValue);
        return this;
    }

    public void setDiscountValue(BigDecimal discountValue) {
        this.discountValue = discountValue;
    }

    public BigDecimal getTaxPercent() {
        return this.taxPercent;
    }

    public InvoiceLine taxPercent(BigDecimal taxPercent) {
        this.setTaxPercent(taxPercent);
        return this;
    }

    public void setTaxPercent(BigDecimal taxPercent) {
        this.taxPercent = taxPercent;
    }

    public BigDecimal getTaxAmount() {
        return this.taxAmount;
    }

    public InvoiceLine taxAmount(BigDecimal taxAmount) {
        this.setTaxAmount(taxAmount);
        return this;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public String getTransactionType() {
        return this.transactionType;
    }

    public InvoiceLine transactionType(String transactionType) {
        this.setTransactionType(transactionType);
        return this;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public BigDecimal getLineAmount() {
        return this.lineAmount;
    }

    public InvoiceLine lineAmount(BigDecimal lineAmount) {
        this.setLineAmount(lineAmount);
        return this;
    }

    public void setLineAmount(BigDecimal lineAmount) {
        this.lineAmount = lineAmount;
    }

    public Integer getLineOrder() {
        return this.lineOrder;
    }

    public InvoiceLine lineOrder(Integer lineOrder) {
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

    public InvoiceLine item(Item item) {
        this.setItem(item);
        return this;
    }

    public Invoice getInvoice() {
        return this.invoice;
    }

    public void setInvoice(Invoice invoice) {
        this.invoice = invoice;
    }

    public InvoiceLine invoice(Invoice invoice) {
        this.setInvoice(invoice);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof InvoiceLine)) {
            return false;
        }
        return getId() != null && getId().equals(((InvoiceLine) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "InvoiceLine{" +
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
