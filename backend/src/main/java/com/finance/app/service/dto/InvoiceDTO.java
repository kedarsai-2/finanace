package com.finance.app.service.dto;

import com.finance.app.domain.enumeration.DiscountKind;
import com.finance.app.domain.enumeration.InvoiceStatus;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.finance.app.domain.Invoice} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class InvoiceDTO implements Serializable {

    private Long id;

    @NotNull
    @Size(max = 32)
    private String number;

    @NotNull
    private Instant date;

    private Instant dueDate;

    @Min(value = 0)
    @Max(value = 3650)
    private Integer paymentTermsDays;

    @NotNull
    @Size(max = 200)
    private String partyName;

    @Size(max = 80)
    private String partyState;

    @Size(max = 80)
    private String businessState;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal subtotal;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal itemDiscountTotal;

    @NotNull
    private DiscountKind overallDiscountKind;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal overallDiscountValue;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal overallDiscountAmount;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal taxableValue;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal cgst;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal sgst;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal igst;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal taxTotal;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal total;

    @NotNull
    @DecimalMin(value = "0")
    private BigDecimal paidAmount;

    @NotNull
    private InvoiceStatus status;

    @Size(max = 4000)
    private String notes;

    @Size(max = 4000)
    private String terms;

    private Instant finalizedAt;

    @Size(max = 10)
    private String cnPaymentMode;

    private Boolean deleted;

    private Instant createdAt;

    private Instant updatedAt;

    private BusinessDTO business;

    private PartyDTO party;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public Instant getDate() {
        return date;
    }

    public void setDate(Instant date) {
        this.date = date;
    }

    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public Integer getPaymentTermsDays() {
        return paymentTermsDays;
    }

    public void setPaymentTermsDays(Integer paymentTermsDays) {
        this.paymentTermsDays = paymentTermsDays;
    }

    public String getPartyName() {
        return partyName;
    }

    public void setPartyName(String partyName) {
        this.partyName = partyName;
    }

    public String getPartyState() {
        return partyState;
    }

    public void setPartyState(String partyState) {
        this.partyState = partyState;
    }

    public String getBusinessState() {
        return businessState;
    }

    public void setBusinessState(String businessState) {
        this.businessState = businessState;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getItemDiscountTotal() {
        return itemDiscountTotal;
    }

    public void setItemDiscountTotal(BigDecimal itemDiscountTotal) {
        this.itemDiscountTotal = itemDiscountTotal;
    }

    public DiscountKind getOverallDiscountKind() {
        return overallDiscountKind;
    }

    public void setOverallDiscountKind(DiscountKind overallDiscountKind) {
        this.overallDiscountKind = overallDiscountKind;
    }

    public BigDecimal getOverallDiscountValue() {
        return overallDiscountValue;
    }

    public void setOverallDiscountValue(BigDecimal overallDiscountValue) {
        this.overallDiscountValue = overallDiscountValue;
    }

    public BigDecimal getOverallDiscountAmount() {
        return overallDiscountAmount;
    }

    public void setOverallDiscountAmount(BigDecimal overallDiscountAmount) {
        this.overallDiscountAmount = overallDiscountAmount;
    }

    public BigDecimal getTaxableValue() {
        return taxableValue;
    }

    public void setTaxableValue(BigDecimal taxableValue) {
        this.taxableValue = taxableValue;
    }

    public BigDecimal getCgst() {
        return cgst;
    }

    public void setCgst(BigDecimal cgst) {
        this.cgst = cgst;
    }

    public BigDecimal getSgst() {
        return sgst;
    }

    public void setSgst(BigDecimal sgst) {
        this.sgst = sgst;
    }

    public BigDecimal getIgst() {
        return igst;
    }

    public void setIgst(BigDecimal igst) {
        this.igst = igst;
    }

    public BigDecimal getTaxTotal() {
        return taxTotal;
    }

    public void setTaxTotal(BigDecimal taxTotal) {
        this.taxTotal = taxTotal;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public InvoiceStatus getStatus() {
        return status;
    }

    public void setStatus(InvoiceStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getTerms() {
        return terms;
    }

    public void setTerms(String terms) {
        this.terms = terms;
    }

    public Instant getFinalizedAt() {
        return finalizedAt;
    }

    public void setFinalizedAt(Instant finalizedAt) {
        this.finalizedAt = finalizedAt;
    }

    public String getCnPaymentMode() {
        return cnPaymentMode;
    }

    public void setCnPaymentMode(String cnPaymentMode) {
        this.cnPaymentMode = cnPaymentMode;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof InvoiceDTO)) {
            return false;
        }

        InvoiceDTO invoiceDTO = (InvoiceDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, invoiceDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "InvoiceDTO{" +
            "id=" + getId() +
            ", number='" + getNumber() + "'" +
            ", date='" + getDate() + "'" +
            ", dueDate='" + getDueDate() + "'" +
            ", paymentTermsDays=" + getPaymentTermsDays() +
            ", partyName='" + getPartyName() + "'" +
            ", partyState='" + getPartyState() + "'" +
            ", businessState='" + getBusinessState() + "'" +
            ", subtotal=" + getSubtotal() +
            ", itemDiscountTotal=" + getItemDiscountTotal() +
            ", overallDiscountKind='" + getOverallDiscountKind() + "'" +
            ", overallDiscountValue=" + getOverallDiscountValue() +
            ", overallDiscountAmount=" + getOverallDiscountAmount() +
            ", taxableValue=" + getTaxableValue() +
            ", cgst=" + getCgst() +
            ", sgst=" + getSgst() +
            ", igst=" + getIgst() +
            ", taxTotal=" + getTaxTotal() +
            ", total=" + getTotal() +
            ", paidAmount=" + getPaidAmount() +
            ", status='" + getStatus() + "'" +
            ", notes='" + getNotes() + "'" +
            ", terms='" + getTerms() + "'" +
            ", finalizedAt='" + getFinalizedAt() + "'" +
            ", cnPaymentMode='" + getCnPaymentMode() + "'" +
            ", deleted='" + getDeleted() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            ", business=" + getBusiness() +
            ", party=" + getParty() +
            "}";
    }
}
