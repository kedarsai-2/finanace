package com.finance.app.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.finance.app.domain.enumeration.DiscountKind;
import com.finance.app.domain.enumeration.PurchaseKind;
import com.finance.app.domain.enumeration.PurchaseStatus;
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
 * A Purchase.
 */
@Entity
@Table(name = "purchase")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Purchase implements Serializable {

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
    private PurchaseStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind")
    private PurchaseKind kind;

    @Column(name = "source_purchase_id")
    private Long sourcePurchaseId;

    @Size(max = 4000)
    @Column(name = "notes", length = 4000)
    private String notes;

    @Size(max = 4000)
    @Column(name = "terms", length = 4000)
    private String terms;

    @Column(name = "finalized_at")
    private Instant finalizedAt;

    @Column(name = "deleted")
    private Boolean deleted;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "purchase")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "item", "purchase" }, allowSetters = true)
    private Set<PurchaseLine> lineses = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "business" }, allowSetters = true)
    private Party party;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Purchase id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumber() {
        return this.number;
    }

    public Purchase number(String number) {
        this.setNumber(number);
        return this;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public Instant getDate() {
        return this.date;
    }

    public Purchase date(Instant date) {
        this.setDate(date);
        return this;
    }

    public void setDate(Instant date) {
        this.date = date;
    }

    public Instant getDueDate() {
        return this.dueDate;
    }

    public Purchase dueDate(Instant dueDate) {
        this.setDueDate(dueDate);
        return this;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public String getPartyName() {
        return this.partyName;
    }

    public Purchase partyName(String partyName) {
        this.setPartyName(partyName);
        return this;
    }

    public void setPartyName(String partyName) {
        this.partyName = partyName;
    }

    public String getPartyState() {
        return this.partyState;
    }

    public Purchase partyState(String partyState) {
        this.setPartyState(partyState);
        return this;
    }

    public void setPartyState(String partyState) {
        this.partyState = partyState;
    }

    public String getBusinessState() {
        return this.businessState;
    }

    public Purchase businessState(String businessState) {
        this.setBusinessState(businessState);
        return this;
    }

    public void setBusinessState(String businessState) {
        this.businessState = businessState;
    }

    public BigDecimal getSubtotal() {
        return this.subtotal;
    }

    public Purchase subtotal(BigDecimal subtotal) {
        this.setSubtotal(subtotal);
        return this;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getItemDiscountTotal() {
        return this.itemDiscountTotal;
    }

    public Purchase itemDiscountTotal(BigDecimal itemDiscountTotal) {
        this.setItemDiscountTotal(itemDiscountTotal);
        return this;
    }

    public void setItemDiscountTotal(BigDecimal itemDiscountTotal) {
        this.itemDiscountTotal = itemDiscountTotal;
    }

    public DiscountKind getOverallDiscountKind() {
        return this.overallDiscountKind;
    }

    public Purchase overallDiscountKind(DiscountKind overallDiscountKind) {
        this.setOverallDiscountKind(overallDiscountKind);
        return this;
    }

    public void setOverallDiscountKind(DiscountKind overallDiscountKind) {
        this.overallDiscountKind = overallDiscountKind;
    }

    public BigDecimal getOverallDiscountValue() {
        return this.overallDiscountValue;
    }

    public Purchase overallDiscountValue(BigDecimal overallDiscountValue) {
        this.setOverallDiscountValue(overallDiscountValue);
        return this;
    }

    public void setOverallDiscountValue(BigDecimal overallDiscountValue) {
        this.overallDiscountValue = overallDiscountValue;
    }

    public BigDecimal getOverallDiscountAmount() {
        return this.overallDiscountAmount;
    }

    public Purchase overallDiscountAmount(BigDecimal overallDiscountAmount) {
        this.setOverallDiscountAmount(overallDiscountAmount);
        return this;
    }

    public void setOverallDiscountAmount(BigDecimal overallDiscountAmount) {
        this.overallDiscountAmount = overallDiscountAmount;
    }

    public BigDecimal getTaxableValue() {
        return this.taxableValue;
    }

    public Purchase taxableValue(BigDecimal taxableValue) {
        this.setTaxableValue(taxableValue);
        return this;
    }

    public void setTaxableValue(BigDecimal taxableValue) {
        this.taxableValue = taxableValue;
    }

    public BigDecimal getCgst() {
        return this.cgst;
    }

    public Purchase cgst(BigDecimal cgst) {
        this.setCgst(cgst);
        return this;
    }

    public void setCgst(BigDecimal cgst) {
        this.cgst = cgst;
    }

    public BigDecimal getSgst() {
        return this.sgst;
    }

    public Purchase sgst(BigDecimal sgst) {
        this.setSgst(sgst);
        return this;
    }

    public void setSgst(BigDecimal sgst) {
        this.sgst = sgst;
    }

    public BigDecimal getIgst() {
        return this.igst;
    }

    public Purchase igst(BigDecimal igst) {
        this.setIgst(igst);
        return this;
    }

    public void setIgst(BigDecimal igst) {
        this.igst = igst;
    }

    public BigDecimal getTaxTotal() {
        return this.taxTotal;
    }

    public Purchase taxTotal(BigDecimal taxTotal) {
        this.setTaxTotal(taxTotal);
        return this;
    }

    public void setTaxTotal(BigDecimal taxTotal) {
        this.taxTotal = taxTotal;
    }

    public BigDecimal getTotal() {
        return this.total;
    }

    public Purchase total(BigDecimal total) {
        this.setTotal(total);
        return this;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getPaidAmount() {
        return this.paidAmount;
    }

    public Purchase paidAmount(BigDecimal paidAmount) {
        this.setPaidAmount(paidAmount);
        return this;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public PurchaseStatus getStatus() {
        return this.status;
    }

    public Purchase status(PurchaseStatus status) {
        this.setStatus(status);
        return this;
    }

    public void setStatus(PurchaseStatus status) {
        this.status = status;
    }

    public PurchaseKind getKind() {
        return this.kind;
    }

    public Purchase kind(PurchaseKind kind) {
        this.setKind(kind);
        return this;
    }

    public void setKind(PurchaseKind kind) {
        this.kind = kind;
    }

    public Long getSourcePurchaseId() {
        return this.sourcePurchaseId;
    }

    public Purchase sourcePurchaseId(Long sourcePurchaseId) {
        this.setSourcePurchaseId(sourcePurchaseId);
        return this;
    }

    public void setSourcePurchaseId(Long sourcePurchaseId) {
        this.sourcePurchaseId = sourcePurchaseId;
    }

    public String getNotes() {
        return this.notes;
    }

    public Purchase notes(String notes) {
        this.setNotes(notes);
        return this;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getTerms() {
        return this.terms;
    }

    public Purchase terms(String terms) {
        this.setTerms(terms);
        return this;
    }

    public void setTerms(String terms) {
        this.terms = terms;
    }

    public Instant getFinalizedAt() {
        return this.finalizedAt;
    }

    public Purchase finalizedAt(Instant finalizedAt) {
        this.setFinalizedAt(finalizedAt);
        return this;
    }

    public void setFinalizedAt(Instant finalizedAt) {
        this.finalizedAt = finalizedAt;
    }

    public Boolean getDeleted() {
        return this.deleted;
    }

    public Purchase deleted(Boolean deleted) {
        this.setDeleted(deleted);
        return this;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public Purchase createdAt(Instant createdAt) {
        this.setCreatedAt(createdAt);
        return this;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return this.updatedAt;
    }

    public Purchase updatedAt(Instant updatedAt) {
        this.setUpdatedAt(updatedAt);
        return this;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Set<PurchaseLine> getLineses() {
        return this.lineses;
    }

    public void setLineses(Set<PurchaseLine> purchaseLines) {
        if (this.lineses != null) {
            this.lineses.forEach(i -> i.setPurchase(null));
        }
        if (purchaseLines != null) {
            purchaseLines.forEach(i -> i.setPurchase(this));
        }
        this.lineses = purchaseLines;
    }

    public Purchase lineses(Set<PurchaseLine> purchaseLines) {
        this.setLineses(purchaseLines);
        return this;
    }

    public Purchase addLines(PurchaseLine purchaseLine) {
        this.lineses.add(purchaseLine);
        purchaseLine.setPurchase(this);
        return this;
    }

    public Purchase removeLines(PurchaseLine purchaseLine) {
        this.lineses.remove(purchaseLine);
        purchaseLine.setPurchase(null);
        return this;
    }

    public Business getBusiness() {
        return this.business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    public Purchase business(Business business) {
        this.setBusiness(business);
        return this;
    }

    public Party getParty() {
        return this.party;
    }

    public void setParty(Party party) {
        this.party = party;
    }

    public Purchase party(Party party) {
        this.setParty(party);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Purchase)) {
            return false;
        }
        return getId() != null && getId().equals(((Purchase) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Purchase{" +
            "id=" + getId() +
            ", number='" + getNumber() + "'" +
            ", date='" + getDate() + "'" +
            ", dueDate='" + getDueDate() + "'" +
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
            ", kind='" + getKind() + "'" +
            ", sourcePurchaseId=" + getSourcePurchaseId() +
            ", notes='" + getNotes() + "'" +
            ", terms='" + getTerms() + "'" +
            ", finalizedAt='" + getFinalizedAt() + "'" +
            ", deleted='" + getDeleted() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            "}";
    }
}
