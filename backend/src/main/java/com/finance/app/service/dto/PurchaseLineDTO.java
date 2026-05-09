package com.finance.app.service.dto;

import com.finance.app.domain.enumeration.DiscountKind;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Objects;

/**
 * A DTO for the {@link com.finance.app.domain.PurchaseLine} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PurchaseLineDTO implements Serializable {

    private Long id;

    @NotNull
    @Size(max = 200)
    private String name;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal qty;

    @NotNull
    @Size(max = 20)
    private String unit;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal rate;

    @NotNull
    private DiscountKind discountKind;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal discountValue;

    @NotNull
    @DecimalMin(value = "0")
    @DecimalMax(value = "100")
    private BigDecimal taxPercent;

    @Size(max = 64)
    private String hsnSac;

    @Size(max = 120)
    private String category;

    @Size(max = 120)
    private String challanOrderNo;

    @DecimalMin(value = "0")
    private BigDecimal taxAmount;

    @Size(max = 40)
    private String transactionType;

    @DecimalMin(value = "0")
    private BigDecimal lineAmount;

    @Min(value = 0)
    private Integer lineOrder;

    private ItemDTO item;

    @NotNull
    private PurchaseDTO purchase;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getQty() {
        return qty;
    }

    public void setQty(BigDecimal qty) {
        this.qty = qty;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public DiscountKind getDiscountKind() {
        return discountKind;
    }

    public void setDiscountKind(DiscountKind discountKind) {
        this.discountKind = discountKind;
    }

    public BigDecimal getDiscountValue() {
        return discountValue;
    }

    public void setDiscountValue(BigDecimal discountValue) {
        this.discountValue = discountValue;
    }

    public BigDecimal getTaxPercent() {
        return taxPercent;
    }

    public void setTaxPercent(BigDecimal taxPercent) {
        this.taxPercent = taxPercent;
    }

    public String getHsnSac() {
        return hsnSac;
    }

    public void setHsnSac(String hsnSac) {
        this.hsnSac = hsnSac;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getChallanOrderNo() {
        return challanOrderNo;
    }

    public void setChallanOrderNo(String challanOrderNo) {
        this.challanOrderNo = challanOrderNo;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public BigDecimal getLineAmount() {
        return lineAmount;
    }

    public void setLineAmount(BigDecimal lineAmount) {
        this.lineAmount = lineAmount;
    }

    public Integer getLineOrder() {
        return lineOrder;
    }

    public void setLineOrder(Integer lineOrder) {
        this.lineOrder = lineOrder;
    }

    public ItemDTO getItem() {
        return item;
    }

    public void setItem(ItemDTO item) {
        this.item = item;
    }

    public PurchaseDTO getPurchase() {
        return purchase;
    }

    public void setPurchase(PurchaseDTO purchase) {
        this.purchase = purchase;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PurchaseLineDTO)) {
            return false;
        }

        PurchaseLineDTO purchaseLineDTO = (PurchaseLineDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, purchaseLineDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PurchaseLineDTO{" +
            "id=" + getId() +
            ", name='" + getName() + "'" +
            ", qty=" + getQty() +
            ", unit='" + getUnit() + "'" +
            ", rate=" + getRate() +
            ", discountKind='" + getDiscountKind() + "'" +
            ", discountValue=" + getDiscountValue() +
            ", taxPercent=" + getTaxPercent() +
            ", hsnSac='" + getHsnSac() + "'" +
            ", category='" + getCategory() + "'" +
            ", challanOrderNo='" + getChallanOrderNo() + "'" +
            ", taxAmount=" + getTaxAmount() +
            ", transactionType='" + getTransactionType() + "'" +
            ", lineAmount=" + getLineAmount() +
            ", lineOrder=" + getLineOrder() +
            ", item=" + getItem() +
            ", purchase=" + getPurchase() +
            "}";
    }
}
