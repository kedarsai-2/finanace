package com.finance.app.service.criteria;

import com.finance.app.domain.enumeration.DiscountKind;
import com.finance.app.domain.enumeration.InvoiceStatus;
import java.io.Serial;
import java.io.Serializable;
import java.util.Objects;
import java.util.Optional;
import org.springdoc.core.annotations.ParameterObject;
import tech.jhipster.service.Criteria;
import tech.jhipster.service.filter.*;

/**
 * Criteria class for the {@link com.finance.app.domain.Invoice} entity. This class is used
 * in {@link com.finance.app.web.rest.InvoiceResource} to receive all the possible filtering options from
 * the Http GET request parameters.
 * For example the following could be a valid request:
 * {@code /invoices?id.greaterThan=5&attr1.contains=something&attr2.specified=false}
 * As Spring is unable to properly convert the types, unless specific {@link Filter} class are used, we need to use
 * fix type specific filters.
 */
@ParameterObject
@SuppressWarnings("common-java:DuplicatedBlocks")
public class InvoiceCriteria implements Serializable, Criteria {

    /**
     * Class for filtering DiscountKind
     */
    public static class DiscountKindFilter extends Filter<DiscountKind> {

        public DiscountKindFilter() {}

        public DiscountKindFilter(DiscountKindFilter filter) {
            super(filter);
        }

        @Override
        public DiscountKindFilter copy() {
            return new DiscountKindFilter(this);
        }
    }

    /**
     * Class for filtering InvoiceStatus
     */
    public static class InvoiceStatusFilter extends Filter<InvoiceStatus> {

        public InvoiceStatusFilter() {}

        public InvoiceStatusFilter(InvoiceStatusFilter filter) {
            super(filter);
        }

        @Override
        public InvoiceStatusFilter copy() {
            return new InvoiceStatusFilter(this);
        }
    }

    @Serial
    private static final long serialVersionUID = 1L;

    private LongFilter id;

    private StringFilter number;

    private InstantFilter date;

    private InstantFilter dueDate;

    private IntegerFilter paymentTermsDays;

    private StringFilter partyName;

    private StringFilter partyState;

    private StringFilter businessState;

    private BigDecimalFilter subtotal;

    private BigDecimalFilter itemDiscountTotal;

    private DiscountKindFilter overallDiscountKind;

    private BigDecimalFilter overallDiscountValue;

    private BigDecimalFilter overallDiscountAmount;

    private BigDecimalFilter taxableValue;

    private BigDecimalFilter cgst;

    private BigDecimalFilter sgst;

    private BigDecimalFilter igst;

    private BigDecimalFilter taxTotal;

    private BigDecimalFilter total;

    private BigDecimalFilter paidAmount;

    private InvoiceStatusFilter status;

    private StringFilter notes;

    private StringFilter terms;

    private InstantFilter finalizedAt;

    private BooleanFilter deleted;

    private InstantFilter createdAt;

    private InstantFilter updatedAt;

    private LongFilter linesId;

    private LongFilter businessId;

    private LongFilter partyId;

    private Boolean distinct;

    public InvoiceCriteria() {}

    public InvoiceCriteria(InvoiceCriteria other) {
        this.id = other.optionalId().map(LongFilter::copy).orElse(null);
        this.number = other.optionalNumber().map(StringFilter::copy).orElse(null);
        this.date = other.optionalDate().map(InstantFilter::copy).orElse(null);
        this.dueDate = other.optionalDueDate().map(InstantFilter::copy).orElse(null);
        this.paymentTermsDays = other.optionalPaymentTermsDays().map(IntegerFilter::copy).orElse(null);
        this.partyName = other.optionalPartyName().map(StringFilter::copy).orElse(null);
        this.partyState = other.optionalPartyState().map(StringFilter::copy).orElse(null);
        this.businessState = other.optionalBusinessState().map(StringFilter::copy).orElse(null);
        this.subtotal = other.optionalSubtotal().map(BigDecimalFilter::copy).orElse(null);
        this.itemDiscountTotal = other.optionalItemDiscountTotal().map(BigDecimalFilter::copy).orElse(null);
        this.overallDiscountKind = other.optionalOverallDiscountKind().map(DiscountKindFilter::copy).orElse(null);
        this.overallDiscountValue = other.optionalOverallDiscountValue().map(BigDecimalFilter::copy).orElse(null);
        this.overallDiscountAmount = other.optionalOverallDiscountAmount().map(BigDecimalFilter::copy).orElse(null);
        this.taxableValue = other.optionalTaxableValue().map(BigDecimalFilter::copy).orElse(null);
        this.cgst = other.optionalCgst().map(BigDecimalFilter::copy).orElse(null);
        this.sgst = other.optionalSgst().map(BigDecimalFilter::copy).orElse(null);
        this.igst = other.optionalIgst().map(BigDecimalFilter::copy).orElse(null);
        this.taxTotal = other.optionalTaxTotal().map(BigDecimalFilter::copy).orElse(null);
        this.total = other.optionalTotal().map(BigDecimalFilter::copy).orElse(null);
        this.paidAmount = other.optionalPaidAmount().map(BigDecimalFilter::copy).orElse(null);
        this.status = other.optionalStatus().map(InvoiceStatusFilter::copy).orElse(null);
        this.notes = other.optionalNotes().map(StringFilter::copy).orElse(null);
        this.terms = other.optionalTerms().map(StringFilter::copy).orElse(null);
        this.finalizedAt = other.optionalFinalizedAt().map(InstantFilter::copy).orElse(null);
        this.deleted = other.optionalDeleted().map(BooleanFilter::copy).orElse(null);
        this.createdAt = other.optionalCreatedAt().map(InstantFilter::copy).orElse(null);
        this.updatedAt = other.optionalUpdatedAt().map(InstantFilter::copy).orElse(null);
        this.linesId = other.optionalLinesId().map(LongFilter::copy).orElse(null);
        this.businessId = other.optionalBusinessId().map(LongFilter::copy).orElse(null);
        this.partyId = other.optionalPartyId().map(LongFilter::copy).orElse(null);
        this.distinct = other.distinct;
    }

    @Override
    public InvoiceCriteria copy() {
        return new InvoiceCriteria(this);
    }

    public LongFilter getId() {
        return id;
    }

    public Optional<LongFilter> optionalId() {
        return Optional.ofNullable(id);
    }

    public LongFilter id() {
        if (id == null) {
            setId(new LongFilter());
        }
        return id;
    }

    public void setId(LongFilter id) {
        this.id = id;
    }

    public StringFilter getNumber() {
        return number;
    }

    public Optional<StringFilter> optionalNumber() {
        return Optional.ofNullable(number);
    }

    public StringFilter number() {
        if (number == null) {
            setNumber(new StringFilter());
        }
        return number;
    }

    public void setNumber(StringFilter number) {
        this.number = number;
    }

    public InstantFilter getDate() {
        return date;
    }

    public Optional<InstantFilter> optionalDate() {
        return Optional.ofNullable(date);
    }

    public InstantFilter date() {
        if (date == null) {
            setDate(new InstantFilter());
        }
        return date;
    }

    public void setDate(InstantFilter date) {
        this.date = date;
    }

    public InstantFilter getDueDate() {
        return dueDate;
    }

    public Optional<InstantFilter> optionalDueDate() {
        return Optional.ofNullable(dueDate);
    }

    public InstantFilter dueDate() {
        if (dueDate == null) {
            setDueDate(new InstantFilter());
        }
        return dueDate;
    }

    public void setDueDate(InstantFilter dueDate) {
        this.dueDate = dueDate;
    }

    public IntegerFilter getPaymentTermsDays() {
        return paymentTermsDays;
    }

    public Optional<IntegerFilter> optionalPaymentTermsDays() {
        return Optional.ofNullable(paymentTermsDays);
    }

    public IntegerFilter paymentTermsDays() {
        if (paymentTermsDays == null) {
            setPaymentTermsDays(new IntegerFilter());
        }
        return paymentTermsDays;
    }

    public void setPaymentTermsDays(IntegerFilter paymentTermsDays) {
        this.paymentTermsDays = paymentTermsDays;
    }

    public StringFilter getPartyName() {
        return partyName;
    }

    public Optional<StringFilter> optionalPartyName() {
        return Optional.ofNullable(partyName);
    }

    public StringFilter partyName() {
        if (partyName == null) {
            setPartyName(new StringFilter());
        }
        return partyName;
    }

    public void setPartyName(StringFilter partyName) {
        this.partyName = partyName;
    }

    public StringFilter getPartyState() {
        return partyState;
    }

    public Optional<StringFilter> optionalPartyState() {
        return Optional.ofNullable(partyState);
    }

    public StringFilter partyState() {
        if (partyState == null) {
            setPartyState(new StringFilter());
        }
        return partyState;
    }

    public void setPartyState(StringFilter partyState) {
        this.partyState = partyState;
    }

    public StringFilter getBusinessState() {
        return businessState;
    }

    public Optional<StringFilter> optionalBusinessState() {
        return Optional.ofNullable(businessState);
    }

    public StringFilter businessState() {
        if (businessState == null) {
            setBusinessState(new StringFilter());
        }
        return businessState;
    }

    public void setBusinessState(StringFilter businessState) {
        this.businessState = businessState;
    }

    public BigDecimalFilter getSubtotal() {
        return subtotal;
    }

    public Optional<BigDecimalFilter> optionalSubtotal() {
        return Optional.ofNullable(subtotal);
    }

    public BigDecimalFilter subtotal() {
        if (subtotal == null) {
            setSubtotal(new BigDecimalFilter());
        }
        return subtotal;
    }

    public void setSubtotal(BigDecimalFilter subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimalFilter getItemDiscountTotal() {
        return itemDiscountTotal;
    }

    public Optional<BigDecimalFilter> optionalItemDiscountTotal() {
        return Optional.ofNullable(itemDiscountTotal);
    }

    public BigDecimalFilter itemDiscountTotal() {
        if (itemDiscountTotal == null) {
            setItemDiscountTotal(new BigDecimalFilter());
        }
        return itemDiscountTotal;
    }

    public void setItemDiscountTotal(BigDecimalFilter itemDiscountTotal) {
        this.itemDiscountTotal = itemDiscountTotal;
    }

    public DiscountKindFilter getOverallDiscountKind() {
        return overallDiscountKind;
    }

    public Optional<DiscountKindFilter> optionalOverallDiscountKind() {
        return Optional.ofNullable(overallDiscountKind);
    }

    public DiscountKindFilter overallDiscountKind() {
        if (overallDiscountKind == null) {
            setOverallDiscountKind(new DiscountKindFilter());
        }
        return overallDiscountKind;
    }

    public void setOverallDiscountKind(DiscountKindFilter overallDiscountKind) {
        this.overallDiscountKind = overallDiscountKind;
    }

    public BigDecimalFilter getOverallDiscountValue() {
        return overallDiscountValue;
    }

    public Optional<BigDecimalFilter> optionalOverallDiscountValue() {
        return Optional.ofNullable(overallDiscountValue);
    }

    public BigDecimalFilter overallDiscountValue() {
        if (overallDiscountValue == null) {
            setOverallDiscountValue(new BigDecimalFilter());
        }
        return overallDiscountValue;
    }

    public void setOverallDiscountValue(BigDecimalFilter overallDiscountValue) {
        this.overallDiscountValue = overallDiscountValue;
    }

    public BigDecimalFilter getOverallDiscountAmount() {
        return overallDiscountAmount;
    }

    public Optional<BigDecimalFilter> optionalOverallDiscountAmount() {
        return Optional.ofNullable(overallDiscountAmount);
    }

    public BigDecimalFilter overallDiscountAmount() {
        if (overallDiscountAmount == null) {
            setOverallDiscountAmount(new BigDecimalFilter());
        }
        return overallDiscountAmount;
    }

    public void setOverallDiscountAmount(BigDecimalFilter overallDiscountAmount) {
        this.overallDiscountAmount = overallDiscountAmount;
    }

    public BigDecimalFilter getTaxableValue() {
        return taxableValue;
    }

    public Optional<BigDecimalFilter> optionalTaxableValue() {
        return Optional.ofNullable(taxableValue);
    }

    public BigDecimalFilter taxableValue() {
        if (taxableValue == null) {
            setTaxableValue(new BigDecimalFilter());
        }
        return taxableValue;
    }

    public void setTaxableValue(BigDecimalFilter taxableValue) {
        this.taxableValue = taxableValue;
    }

    public BigDecimalFilter getCgst() {
        return cgst;
    }

    public Optional<BigDecimalFilter> optionalCgst() {
        return Optional.ofNullable(cgst);
    }

    public BigDecimalFilter cgst() {
        if (cgst == null) {
            setCgst(new BigDecimalFilter());
        }
        return cgst;
    }

    public void setCgst(BigDecimalFilter cgst) {
        this.cgst = cgst;
    }

    public BigDecimalFilter getSgst() {
        return sgst;
    }

    public Optional<BigDecimalFilter> optionalSgst() {
        return Optional.ofNullable(sgst);
    }

    public BigDecimalFilter sgst() {
        if (sgst == null) {
            setSgst(new BigDecimalFilter());
        }
        return sgst;
    }

    public void setSgst(BigDecimalFilter sgst) {
        this.sgst = sgst;
    }

    public BigDecimalFilter getIgst() {
        return igst;
    }

    public Optional<BigDecimalFilter> optionalIgst() {
        return Optional.ofNullable(igst);
    }

    public BigDecimalFilter igst() {
        if (igst == null) {
            setIgst(new BigDecimalFilter());
        }
        return igst;
    }

    public void setIgst(BigDecimalFilter igst) {
        this.igst = igst;
    }

    public BigDecimalFilter getTaxTotal() {
        return taxTotal;
    }

    public Optional<BigDecimalFilter> optionalTaxTotal() {
        return Optional.ofNullable(taxTotal);
    }

    public BigDecimalFilter taxTotal() {
        if (taxTotal == null) {
            setTaxTotal(new BigDecimalFilter());
        }
        return taxTotal;
    }

    public void setTaxTotal(BigDecimalFilter taxTotal) {
        this.taxTotal = taxTotal;
    }

    public BigDecimalFilter getTotal() {
        return total;
    }

    public Optional<BigDecimalFilter> optionalTotal() {
        return Optional.ofNullable(total);
    }

    public BigDecimalFilter total() {
        if (total == null) {
            setTotal(new BigDecimalFilter());
        }
        return total;
    }

    public void setTotal(BigDecimalFilter total) {
        this.total = total;
    }

    public BigDecimalFilter getPaidAmount() {
        return paidAmount;
    }

    public Optional<BigDecimalFilter> optionalPaidAmount() {
        return Optional.ofNullable(paidAmount);
    }

    public BigDecimalFilter paidAmount() {
        if (paidAmount == null) {
            setPaidAmount(new BigDecimalFilter());
        }
        return paidAmount;
    }

    public void setPaidAmount(BigDecimalFilter paidAmount) {
        this.paidAmount = paidAmount;
    }

    public InvoiceStatusFilter getStatus() {
        return status;
    }

    public Optional<InvoiceStatusFilter> optionalStatus() {
        return Optional.ofNullable(status);
    }

    public InvoiceStatusFilter status() {
        if (status == null) {
            setStatus(new InvoiceStatusFilter());
        }
        return status;
    }

    public void setStatus(InvoiceStatusFilter status) {
        this.status = status;
    }

    public StringFilter getNotes() {
        return notes;
    }

    public Optional<StringFilter> optionalNotes() {
        return Optional.ofNullable(notes);
    }

    public StringFilter notes() {
        if (notes == null) {
            setNotes(new StringFilter());
        }
        return notes;
    }

    public void setNotes(StringFilter notes) {
        this.notes = notes;
    }

    public StringFilter getTerms() {
        return terms;
    }

    public Optional<StringFilter> optionalTerms() {
        return Optional.ofNullable(terms);
    }

    public StringFilter terms() {
        if (terms == null) {
            setTerms(new StringFilter());
        }
        return terms;
    }

    public void setTerms(StringFilter terms) {
        this.terms = terms;
    }

    public InstantFilter getFinalizedAt() {
        return finalizedAt;
    }

    public Optional<InstantFilter> optionalFinalizedAt() {
        return Optional.ofNullable(finalizedAt);
    }

    public InstantFilter finalizedAt() {
        if (finalizedAt == null) {
            setFinalizedAt(new InstantFilter());
        }
        return finalizedAt;
    }

    public void setFinalizedAt(InstantFilter finalizedAt) {
        this.finalizedAt = finalizedAt;
    }

    public BooleanFilter getDeleted() {
        return deleted;
    }

    public Optional<BooleanFilter> optionalDeleted() {
        return Optional.ofNullable(deleted);
    }

    public BooleanFilter deleted() {
        if (deleted == null) {
            setDeleted(new BooleanFilter());
        }
        return deleted;
    }

    public void setDeleted(BooleanFilter deleted) {
        this.deleted = deleted;
    }

    public InstantFilter getCreatedAt() {
        return createdAt;
    }

    public Optional<InstantFilter> optionalCreatedAt() {
        return Optional.ofNullable(createdAt);
    }

    public InstantFilter createdAt() {
        if (createdAt == null) {
            setCreatedAt(new InstantFilter());
        }
        return createdAt;
    }

    public void setCreatedAt(InstantFilter createdAt) {
        this.createdAt = createdAt;
    }

    public InstantFilter getUpdatedAt() {
        return updatedAt;
    }

    public Optional<InstantFilter> optionalUpdatedAt() {
        return Optional.ofNullable(updatedAt);
    }

    public InstantFilter updatedAt() {
        if (updatedAt == null) {
            setUpdatedAt(new InstantFilter());
        }
        return updatedAt;
    }

    public void setUpdatedAt(InstantFilter updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LongFilter getLinesId() {
        return linesId;
    }

    public Optional<LongFilter> optionalLinesId() {
        return Optional.ofNullable(linesId);
    }

    public LongFilter linesId() {
        if (linesId == null) {
            setLinesId(new LongFilter());
        }
        return linesId;
    }

    public void setLinesId(LongFilter linesId) {
        this.linesId = linesId;
    }

    public LongFilter getBusinessId() {
        return businessId;
    }

    public Optional<LongFilter> optionalBusinessId() {
        return Optional.ofNullable(businessId);
    }

    public LongFilter businessId() {
        if (businessId == null) {
            setBusinessId(new LongFilter());
        }
        return businessId;
    }

    public void setBusinessId(LongFilter businessId) {
        this.businessId = businessId;
    }

    public LongFilter getPartyId() {
        return partyId;
    }

    public Optional<LongFilter> optionalPartyId() {
        return Optional.ofNullable(partyId);
    }

    public LongFilter partyId() {
        if (partyId == null) {
            setPartyId(new LongFilter());
        }
        return partyId;
    }

    public void setPartyId(LongFilter partyId) {
        this.partyId = partyId;
    }

    public Boolean getDistinct() {
        return distinct;
    }

    public Optional<Boolean> optionalDistinct() {
        return Optional.ofNullable(distinct);
    }

    public Boolean distinct() {
        if (distinct == null) {
            setDistinct(true);
        }
        return distinct;
    }

    public void setDistinct(Boolean distinct) {
        this.distinct = distinct;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        final InvoiceCriteria that = (InvoiceCriteria) o;
        return (
            Objects.equals(id, that.id) &&
            Objects.equals(number, that.number) &&
            Objects.equals(date, that.date) &&
            Objects.equals(dueDate, that.dueDate) &&
            Objects.equals(paymentTermsDays, that.paymentTermsDays) &&
            Objects.equals(partyName, that.partyName) &&
            Objects.equals(partyState, that.partyState) &&
            Objects.equals(businessState, that.businessState) &&
            Objects.equals(subtotal, that.subtotal) &&
            Objects.equals(itemDiscountTotal, that.itemDiscountTotal) &&
            Objects.equals(overallDiscountKind, that.overallDiscountKind) &&
            Objects.equals(overallDiscountValue, that.overallDiscountValue) &&
            Objects.equals(overallDiscountAmount, that.overallDiscountAmount) &&
            Objects.equals(taxableValue, that.taxableValue) &&
            Objects.equals(cgst, that.cgst) &&
            Objects.equals(sgst, that.sgst) &&
            Objects.equals(igst, that.igst) &&
            Objects.equals(taxTotal, that.taxTotal) &&
            Objects.equals(total, that.total) &&
            Objects.equals(paidAmount, that.paidAmount) &&
            Objects.equals(status, that.status) &&
            Objects.equals(notes, that.notes) &&
            Objects.equals(terms, that.terms) &&
            Objects.equals(finalizedAt, that.finalizedAt) &&
            Objects.equals(deleted, that.deleted) &&
            Objects.equals(createdAt, that.createdAt) &&
            Objects.equals(updatedAt, that.updatedAt) &&
            Objects.equals(linesId, that.linesId) &&
            Objects.equals(businessId, that.businessId) &&
            Objects.equals(partyId, that.partyId) &&
            Objects.equals(distinct, that.distinct)
        );
    }

    @Override
    public int hashCode() {
        return Objects.hash(
            id,
            number,
            date,
            dueDate,
            paymentTermsDays,
            partyName,
            partyState,
            businessState,
            subtotal,
            itemDiscountTotal,
            overallDiscountKind,
            overallDiscountValue,
            overallDiscountAmount,
            taxableValue,
            cgst,
            sgst,
            igst,
            taxTotal,
            total,
            paidAmount,
            status,
            notes,
            terms,
            finalizedAt,
            deleted,
            createdAt,
            updatedAt,
            linesId,
            businessId,
            partyId,
            distinct
        );
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "InvoiceCriteria{" +
            optionalId().map(f -> "id=" + f + ", ").orElse("") +
            optionalNumber().map(f -> "number=" + f + ", ").orElse("") +
            optionalDate().map(f -> "date=" + f + ", ").orElse("") +
            optionalDueDate().map(f -> "dueDate=" + f + ", ").orElse("") +
            optionalPaymentTermsDays().map(f -> "paymentTermsDays=" + f + ", ").orElse("") +
            optionalPartyName().map(f -> "partyName=" + f + ", ").orElse("") +
            optionalPartyState().map(f -> "partyState=" + f + ", ").orElse("") +
            optionalBusinessState().map(f -> "businessState=" + f + ", ").orElse("") +
            optionalSubtotal().map(f -> "subtotal=" + f + ", ").orElse("") +
            optionalItemDiscountTotal().map(f -> "itemDiscountTotal=" + f + ", ").orElse("") +
            optionalOverallDiscountKind().map(f -> "overallDiscountKind=" + f + ", ").orElse("") +
            optionalOverallDiscountValue().map(f -> "overallDiscountValue=" + f + ", ").orElse("") +
            optionalOverallDiscountAmount().map(f -> "overallDiscountAmount=" + f + ", ").orElse("") +
            optionalTaxableValue().map(f -> "taxableValue=" + f + ", ").orElse("") +
            optionalCgst().map(f -> "cgst=" + f + ", ").orElse("") +
            optionalSgst().map(f -> "sgst=" + f + ", ").orElse("") +
            optionalIgst().map(f -> "igst=" + f + ", ").orElse("") +
            optionalTaxTotal().map(f -> "taxTotal=" + f + ", ").orElse("") +
            optionalTotal().map(f -> "total=" + f + ", ").orElse("") +
            optionalPaidAmount().map(f -> "paidAmount=" + f + ", ").orElse("") +
            optionalStatus().map(f -> "status=" + f + ", ").orElse("") +
            optionalNotes().map(f -> "notes=" + f + ", ").orElse("") +
            optionalTerms().map(f -> "terms=" + f + ", ").orElse("") +
            optionalFinalizedAt().map(f -> "finalizedAt=" + f + ", ").orElse("") +
            optionalDeleted().map(f -> "deleted=" + f + ", ").orElse("") +
            optionalCreatedAt().map(f -> "createdAt=" + f + ", ").orElse("") +
            optionalUpdatedAt().map(f -> "updatedAt=" + f + ", ").orElse("") +
            optionalLinesId().map(f -> "linesId=" + f + ", ").orElse("") +
            optionalBusinessId().map(f -> "businessId=" + f + ", ").orElse("") +
            optionalPartyId().map(f -> "partyId=" + f + ", ").orElse("") +
            optionalDistinct().map(f -> "distinct=" + f + ", ").orElse("") +
        "}";
    }
}
