package com.finance.app.service.dto;

import com.finance.app.domain.enumeration.PaymentMode;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.finance.app.domain.Expense} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ExpenseDTO implements Serializable {

    private Long id;

    @NotNull
    private Instant date;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal amount;

    @NotNull
    @Size(max = 120)
    private String category;

    private PaymentMode mode;

    @Size(max = 120)
    private String reference;

    @Size(max = 2000)
    private String notes;

    @DecimalMin(value = "0")
    private BigDecimal receivedPaidAmount;

    @DecimalMin(value = "0")
    private BigDecimal balanceDue;

    @Size(max = 120)
    private String orderNo;

    @Size(max = 200)
    private String itemName;

    @Size(max = 2000)
    private String itemDescription;

    @Size(max = 64)
    private String hsnSac;

    @DecimalMin(value = "0")
    private BigDecimal quantity;

    @DecimalMin(value = "0")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0")
    private BigDecimal discountPercent;

    @DecimalMin(value = "0")
    private BigDecimal discountAmount;

    @DecimalMin(value = "0")
    private BigDecimal taxPercent;

    @DecimalMin(value = "0")
    private BigDecimal taxAmount;

    @DecimalMin(value = "0")
    private BigDecimal lineAmount;

    private String proofDataUrl;

    @Size(max = 255)
    private String proofName;

    private Boolean deleted;

    private Instant createdAt;

    private Instant updatedAt;

    private BusinessDTO business;

    private PartyDTO party;

    private AccountDTO account;

    private Boolean excludeFromLedger;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getDate() {
        return date;
    }

    public void setDate(Instant date) {
        this.date = date;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public PaymentMode getMode() {
        return mode;
    }

    public void setMode(PaymentMode mode) {
        this.mode = mode;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public BigDecimal getReceivedPaidAmount() {
        return receivedPaidAmount;
    }

    public void setReceivedPaidAmount(BigDecimal receivedPaidAmount) {
        this.receivedPaidAmount = receivedPaidAmount;
    }

    public BigDecimal getBalanceDue() {
        return balanceDue;
    }

    public void setBalanceDue(BigDecimal balanceDue) {
        this.balanceDue = balanceDue;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getItemDescription() {
        return itemDescription;
    }

    public void setItemDescription(String itemDescription) {
        this.itemDescription = itemDescription;
    }

    public String getHsnSac() {
        return hsnSac;
    }

    public void setHsnSac(String hsnSac) {
        this.hsnSac = hsnSac;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(BigDecimal discountPercent) {
        this.discountPercent = discountPercent;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getTaxPercent() {
        return taxPercent;
    }

    public void setTaxPercent(BigDecimal taxPercent) {
        this.taxPercent = taxPercent;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getLineAmount() {
        return lineAmount;
    }

    public void setLineAmount(BigDecimal lineAmount) {
        this.lineAmount = lineAmount;
    }

    public String getProofDataUrl() {
        return proofDataUrl;
    }

    public void setProofDataUrl(String proofDataUrl) {
        this.proofDataUrl = proofDataUrl;
    }

    public String getProofName() {
        return proofName;
    }

    public void setProofName(String proofName) {
        this.proofName = proofName;
    }

    public Boolean getDeleted() {
        return deleted;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public BusinessDTO getBusiness() {
        return business;
    }

    public void setBusiness(BusinessDTO business) {
        this.business = business;
    }

    public PartyDTO getParty() {
        return party;
    }

    public void setParty(PartyDTO party) {
        this.party = party;
    }

    public AccountDTO getAccount() {
        return account;
    }

    public void setAccount(AccountDTO account) {
        this.account = account;
    }

    public Boolean getExcludeFromLedger() {
        return excludeFromLedger;
    }

    public void setExcludeFromLedger(Boolean excludeFromLedger) {
        this.excludeFromLedger = excludeFromLedger;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ExpenseDTO)) {
            return false;
        }

        ExpenseDTO expenseDTO = (ExpenseDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, expenseDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ExpenseDTO{" +
            "id=" + getId() +
            ", date='" + getDate() + "'" +
            ", amount=" + getAmount() +
            ", category='" + getCategory() + "'" +
            ", mode='" + getMode() + "'" +
            ", reference='" + getReference() + "'" +
            ", notes='" + getNotes() + "'" +
            ", receivedPaidAmount=" + getReceivedPaidAmount() +
            ", balanceDue=" + getBalanceDue() +
            ", orderNo='" + getOrderNo() + "'" +
            ", itemName='" + getItemName() + "'" +
            ", itemDescription='" + getItemDescription() + "'" +
            ", hsnSac='" + getHsnSac() + "'" +
            ", quantity=" + getQuantity() +
            ", unitPrice=" + getUnitPrice() +
            ", discountPercent=" + getDiscountPercent() +
            ", discountAmount=" + getDiscountAmount() +
            ", taxPercent=" + getTaxPercent() +
            ", taxAmount=" + getTaxAmount() +
            ", lineAmount=" + getLineAmount() +
            ", deleted='" + getDeleted() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            ", business=" + getBusiness() +
            ", party=" + getParty() +
            ", account=" + getAccount() +
            "}";
    }
}
