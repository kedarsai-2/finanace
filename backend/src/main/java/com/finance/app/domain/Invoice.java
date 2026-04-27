package com.finance.app.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.finance.app.domain.enumeration.DiscountKind;
import com.finance.app.domain.enumeration.InvoiceStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Invoice.
 */
@Entity
@Table(name = "invoice")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Invoice implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Size(max = 32)
    @Column(name = "number", length = 32, nullable = false)
    private String number;

    @NotNull
    @Column(name = "date", nullable = false)
    private Instant date;

    @Column(name = "due_date")
    private Instant dueDate;

    @Min(value = 0)
    @Max(value = 3650)
    @Column(name = "payment_terms_days")
    private Integer paymentTermsDays;

    @NotNull
    @Size(max = 200)
    @Column(name = "party_name", length = 200, nullable = false)
    private String partyName;

    @Size(max = 80)
    @Column(name = "party_state", length = 80)
    private String partyState;

    @Size(max = 80)
    @Column(name = "business_state", length = 80)
    private String businessState;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "subtotal", precision = 21, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "item_discount_total", precision = 21, scale = 2, nullable = false)
    private BigDecimal itemDiscountTotal;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "overall_discount_kind", nullable = false)
    private DiscountKind overallDiscountKind;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "overall_discount_value", precision = 21, scale = 2, nullable = false)
    private BigDecimal overallDiscountValue;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "overall_discount_amount", precision = 21, scale = 2, nullable = false)
    private BigDecimal overallDiscountAmount;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "taxable_value", precision = 21, scale = 2, nullable = false)
    private BigDecimal taxableValue;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "cgst", precision = 21, scale = 2, nullable = false)
    private BigDecimal cgst;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "sgst", precision = 21, scale = 2, nullable = false)
    private BigDecimal sgst;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "igst", precision = 21, scale = 2, nullable = false)
    private BigDecimal igst;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "tax_total", precision = 21, scale = 2, nullable = false)
    private BigDecimal taxTotal;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "total", precision = 21, scale = 2, nullable = false)
    private BigDecimal total;

    @NotNull
    @DecimalMin(value = "0")
    @Column(name = "paid_amount", precision = 21, scale = 2, nullable = false)
    private BigDecimal paidAmount;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InvoiceStatus status;

    @Size(max = 4000)
    @Column(name = "notes", length = 4000)
    private String notes;

    @Size(max = 4000)
    @Column(name = "terms", length = 4000)
    private String terms;

    @Column(name = "finalized_at")
    private Instant finalizedAt;

    @Size(max = 10)
    @Column(name = "cn_payment_mode", length = 10)
    private String cnPaymentMode;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = createdAt;
        if (deleted == null) deleted = false;
        if (paidAmount == null) paidAmount = BigDecimal.ZERO;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
        if (deleted == null) deleted = false;
        if (paidAmount == null) paidAmount = BigDecimal.ZERO;
    }

    @Column(name = "deleted")
    private Boolean deleted;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "invoice")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "item", "invoice" }, allowSetters = true)
    private Set<InvoiceLine> lineses = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "business" }, allowSetters = true)
    private Party party;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Invoice id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumber() {
        return this.number;
    }

    public Invoice number(String number) {
        this.setNumber(number);
        return this;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public Instant getDate() {
        return this.date;
    }

    public Invoice date(Instant date) {
        this.setDate(date);
        return this;
    }

    public void setDate(Instant date) {
        this.date = date;
    }

    public Instant getDueDate() {
        return this.dueDate;
    }

    public Invoice dueDate(Instant dueDate) {
        this.setDueDate(dueDate);
        return this;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public Integer getPaymentTermsDays() {
        return this.paymentTermsDays;
    }

    public Invoice paymentTermsDays(Integer paymentTermsDays) {
        this.setPaymentTermsDays(paymentTermsDays);
        return this;
    }

    public void setPaymentTermsDays(Integer paymentTermsDays) {
        this.paymentTermsDays = paymentTermsDays;
    }

    public String getPartyName() {
        return this.partyName;
    }

    public Invoice partyName(String partyName) {
        this.setPartyName(partyName);
        return this;
    }

    public void setPartyName(String partyName) {
        this.partyName = partyName;
    }

    public String getPartyState() {
        return this.partyState;
    }

    public Invoice partyState(String partyState) {
        this.setPartyState(partyState);
        return this;
    }

    public void setPartyState(String partyState) {
        this.partyState = partyState;
    }

    public String getBusinessState() {
        return this.businessState;
    }

    public Invoice businessState(String businessState) {
        this.setBusinessState(businessState);
        return this;
    }

    public void setBusinessState(String businessState) {
        this.businessState = businessState;
    }

    public BigDecimal getSubtotal() {
        return this.subtotal;
    }

    public Invoice subtotal(BigDecimal subtotal) {
        this.setSubtotal(subtotal);
        return this;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getItemDiscountTotal() {
        return this.itemDiscountTotal;
    }

    public Invoice itemDiscountTotal(BigDecimal itemDiscountTotal) {
        this.setItemDiscountTotal(itemDiscountTotal);
        return this;
    }

    public void setItemDiscountTotal(BigDecimal itemDiscountTotal) {
        this.itemDiscountTotal = itemDiscountTotal;
    }

    public DiscountKind getOverallDiscountKind() {
        return this.overallDiscountKind;
    }

    public Invoice overallDiscountKind(DiscountKind overallDiscountKind) {
        this.setOverallDiscountKind(overallDiscountKind);
        return this;
    }

    public void setOverallDiscountKind(DiscountKind overallDiscountKind) {
        this.overallDiscountKind = overallDiscountKind;
    }

    public BigDecimal getOverallDiscountValue() {
        return this.overallDiscountValue;
    }

    public Invoice overallDiscountValue(BigDecimal overallDiscountValue) {
        this.setOverallDiscountValue(overallDiscountValue);
        return this;
    }

    public void setOverallDiscountValue(BigDecimal overallDiscountValue) {
        this.overallDiscountValue = overallDiscountValue;
    }

    public BigDecimal getOverallDiscountAmount() {
        return this.overallDiscountAmount;
    }

    public Invoice overallDiscountAmount(BigDecimal overallDiscountAmount) {
        this.setOverallDiscountAmount(overallDiscountAmount);
        return this;
    }

    public void setOverallDiscountAmount(BigDecimal overallDiscountAmount) {
        this.overallDiscountAmount = overallDiscountAmount;
    }

    public BigDecimal getTaxableValue() {
        return this.taxableValue;
    }

    public Invoice taxableValue(BigDecimal taxableValue) {
        this.setTaxableValue(taxableValue);
        return this;
    }

    public void setTaxableValue(BigDecimal taxableValue) {
        this.taxableValue = taxableValue;
    }

    public BigDecimal getCgst() {
        return this.cgst;
    }

    public Invoice cgst(BigDecimal cgst) {
        this.setCgst(cgst);
        return this;
    }

    public void setCgst(BigDecimal cgst) {
        this.cgst = cgst;
    }

    public BigDecimal getSgst() {
        return this.sgst;
    }

    public Invoice sgst(BigDecimal sgst) {
        this.setSgst(sgst);
        return this;
    }

    public void setSgst(BigDecimal sgst) {
        this.sgst = sgst;
    }

    public BigDecimal getIgst() {
        return this.igst;
    }

    public Invoice igst(BigDecimal igst) {
        this.setIgst(igst);
        return this;
    }

    public void setIgst(BigDecimal igst) {
        this.igst = igst;
    }

    public BigDecimal getTaxTotal() {
        return this.taxTotal;
    }

    public Invoice taxTotal(BigDecimal taxTotal) {
        this.setTaxTotal(taxTotal);
        return this;
    }

    public void setTaxTotal(BigDecimal taxTotal) {
        this.taxTotal = taxTotal;
    }

    public BigDecimal getTotal() {
        return this.total;
    }

    public Invoice total(BigDecimal total) {
        this.setTotal(total);
        return this;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getPaidAmount() {
        return this.paidAmount;
    }

    public Invoice paidAmount(BigDecimal paidAmount) {
        this.setPaidAmount(paidAmount);
        return this;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public InvoiceStatus getStatus() {
        return this.status;
    }

    public Invoice status(InvoiceStatus status) {
        this.setStatus(status);
        return this;
    }

    public void setStatus(InvoiceStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return this.notes;
    }

    public Invoice notes(String notes) {
        this.setNotes(notes);
        return this;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getTerms() {
        return this.terms;
    }

    public Invoice terms(String terms) {
        this.setTerms(terms);
        return this;
    }

    public void setTerms(String terms) {
        this.terms = terms;
    }

    public Instant getFinalizedAt() {
        return this.finalizedAt;
    }

    public Invoice finalizedAt(Instant finalizedAt) {
        this.setFinalizedAt(finalizedAt);
        return this;
    }

    public void setFinalizedAt(Instant finalizedAt) {
        this.finalizedAt = finalizedAt;
    }

    public String getCnPaymentMode() {
        return this.cnPaymentMode;
    }

    public Invoice cnPaymentMode(String cnPaymentMode) {
        this.setCnPaymentMode(cnPaymentMode);
        return this;
    }

    public void setCnPaymentMode(String cnPaymentMode) {
        this.cnPaymentMode = cnPaymentMode;
    }

    public Boolean getDeleted() {
        return this.deleted;
    }

    public Invoice deleted(Boolean deleted) {
        this.setDeleted(deleted);
        return this;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public Invoice createdAt(Instant createdAt) {
        this.setCreatedAt(createdAt);
        return this;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return this.updatedAt;
    }

    public Invoice updatedAt(Instant updatedAt) {
        this.setUpdatedAt(updatedAt);
        return this;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Set<InvoiceLine> getLineses() {
        return this.lineses;
    }

    public void setLineses(Set<InvoiceLine> invoiceLines) {
        if (this.lineses != null) {
            this.lineses.forEach(i -> i.setInvoice(null));
        }
        if (invoiceLines != null) {
            invoiceLines.forEach(i -> i.setInvoice(this));
        }
        this.lineses = invoiceLines;
    }

    public Invoice lineses(Set<InvoiceLine> invoiceLines) {
        this.setLineses(invoiceLines);
        return this;
    }

    public Invoice addLines(InvoiceLine invoiceLine) {
        this.lineses.add(invoiceLine);
        invoiceLine.setInvoice(this);
        return this;
    }

    public Invoice removeLines(InvoiceLine invoiceLine) {
        this.lineses.remove(invoiceLine);
        invoiceLine.setInvoice(null);
        return this;
    }

    public Business getBusiness() {
        return this.business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    public Invoice business(Business business) {
        this.setBusiness(business);
        return this;
    }

    public Party getParty() {
        return this.party;
    }

    public void setParty(Party party) {
        this.party = party;
    }

    public Invoice party(Party party) {
        this.setParty(party);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Invoice)) {
            return false;
        }
        return getId() != null && getId().equals(((Invoice) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Invoice{" +
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
            "}";
    }
}
