package com.finance.app.service.criteria;

import com.finance.app.domain.enumeration.PaymentMode;
import java.io.Serial;
import java.io.Serializable;
import java.util.Objects;
import java.util.Optional;
import org.springdoc.core.annotations.ParameterObject;
import tech.jhipster.service.Criteria;
import tech.jhipster.service.filter.*;

/**
 * Criteria class for the {@link com.finance.app.domain.Expense} entity. This class is used
 * in {@link com.finance.app.web.rest.ExpenseResource} to receive all the possible filtering options from
 * the Http GET request parameters.
 * For example the following could be a valid request:
 * {@code /expenses?id.greaterThan=5&attr1.contains=something&attr2.specified=false}
 * As Spring is unable to properly convert the types, unless specific {@link Filter} class are used, we need to use
 * fix type specific filters.
 */
@ParameterObject
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ExpenseCriteria implements Serializable, Criteria {

    /**
     * Class for filtering PaymentMode
     */
    public static class PaymentModeFilter extends Filter<PaymentMode> {

        public PaymentModeFilter() {}

        public PaymentModeFilter(PaymentModeFilter filter) {
            super(filter);
        }

        @Override
        public PaymentModeFilter copy() {
            return new PaymentModeFilter(this);
        }
    }

    @Serial
    private static final long serialVersionUID = 1L;

    private LongFilter id;

    private InstantFilter date;

    private BigDecimalFilter amount;

    private StringFilter category;

    private PaymentModeFilter mode;

    private StringFilter reference;

    private StringFilter notes;

    private BooleanFilter deleted;

    private InstantFilter createdAt;

    private InstantFilter updatedAt;

    private LongFilter businessId;

    private LongFilter partyId;

    private LongFilter accountId;

    private Boolean distinct;

    public ExpenseCriteria() {}

    public ExpenseCriteria(ExpenseCriteria other) {
        this.id = other.optionalId().map(LongFilter::copy).orElse(null);
        this.date = other.optionalDate().map(InstantFilter::copy).orElse(null);
        this.amount = other.optionalAmount().map(BigDecimalFilter::copy).orElse(null);
        this.category = other.optionalCategory().map(StringFilter::copy).orElse(null);
        this.mode = other.optionalMode().map(PaymentModeFilter::copy).orElse(null);
        this.reference = other.optionalReference().map(StringFilter::copy).orElse(null);
        this.notes = other.optionalNotes().map(StringFilter::copy).orElse(null);
        this.deleted = other.optionalDeleted().map(BooleanFilter::copy).orElse(null);
        this.createdAt = other.optionalCreatedAt().map(InstantFilter::copy).orElse(null);
        this.updatedAt = other.optionalUpdatedAt().map(InstantFilter::copy).orElse(null);
        this.businessId = other.optionalBusinessId().map(LongFilter::copy).orElse(null);
        this.partyId = other.optionalPartyId().map(LongFilter::copy).orElse(null);
        this.accountId = other.optionalAccountId().map(LongFilter::copy).orElse(null);
        this.distinct = other.distinct;
    }

    @Override
    public ExpenseCriteria copy() {
        return new ExpenseCriteria(this);
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

    public BigDecimalFilter getAmount() {
        return amount;
    }

    public Optional<BigDecimalFilter> optionalAmount() {
        return Optional.ofNullable(amount);
    }

    public BigDecimalFilter amount() {
        if (amount == null) {
            setAmount(new BigDecimalFilter());
        }
        return amount;
    }

    public void setAmount(BigDecimalFilter amount) {
        this.amount = amount;
    }

    public StringFilter getCategory() {
        return category;
    }

    public Optional<StringFilter> optionalCategory() {
        return Optional.ofNullable(category);
    }

    public StringFilter category() {
        if (category == null) {
            setCategory(new StringFilter());
        }
        return category;
    }

    public void setCategory(StringFilter category) {
        this.category = category;
    }

    public PaymentModeFilter getMode() {
        return mode;
    }

    public Optional<PaymentModeFilter> optionalMode() {
        return Optional.ofNullable(mode);
    }

    public PaymentModeFilter mode() {
        if (mode == null) {
            setMode(new PaymentModeFilter());
        }
        return mode;
    }

    public void setMode(PaymentModeFilter mode) {
        this.mode = mode;
    }

    public StringFilter getReference() {
        return reference;
    }

    public Optional<StringFilter> optionalReference() {
        return Optional.ofNullable(reference);
    }

    public StringFilter reference() {
        if (reference == null) {
            setReference(new StringFilter());
        }
        return reference;
    }

    public void setReference(StringFilter reference) {
        this.reference = reference;
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

    public LongFilter getAccountId() {
        return accountId;
    }

    public Optional<LongFilter> optionalAccountId() {
        return Optional.ofNullable(accountId);
    }

    public LongFilter accountId() {
        if (accountId == null) {
            setAccountId(new LongFilter());
        }
        return accountId;
    }

    public void setAccountId(LongFilter accountId) {
        this.accountId = accountId;
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
        final ExpenseCriteria that = (ExpenseCriteria) o;
        return (
            Objects.equals(id, that.id) &&
            Objects.equals(date, that.date) &&
            Objects.equals(amount, that.amount) &&
            Objects.equals(category, that.category) &&
            Objects.equals(mode, that.mode) &&
            Objects.equals(reference, that.reference) &&
            Objects.equals(notes, that.notes) &&
            Objects.equals(deleted, that.deleted) &&
            Objects.equals(createdAt, that.createdAt) &&
            Objects.equals(updatedAt, that.updatedAt) &&
            Objects.equals(businessId, that.businessId) &&
            Objects.equals(partyId, that.partyId) &&
            Objects.equals(accountId, that.accountId) &&
            Objects.equals(distinct, that.distinct)
        );
    }

    @Override
    public int hashCode() {
        return Objects.hash(
            id,
            date,
            amount,
            category,
            mode,
            reference,
            notes,
            deleted,
            createdAt,
            updatedAt,
            businessId,
            partyId,
            accountId,
            distinct
        );
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ExpenseCriteria{" +
            optionalId().map(f -> "id=" + f + ", ").orElse("") +
            optionalDate().map(f -> "date=" + f + ", ").orElse("") +
            optionalAmount().map(f -> "amount=" + f + ", ").orElse("") +
            optionalCategory().map(f -> "category=" + f + ", ").orElse("") +
            optionalMode().map(f -> "mode=" + f + ", ").orElse("") +
            optionalReference().map(f -> "reference=" + f + ", ").orElse("") +
            optionalNotes().map(f -> "notes=" + f + ", ").orElse("") +
            optionalDeleted().map(f -> "deleted=" + f + ", ").orElse("") +
            optionalCreatedAt().map(f -> "createdAt=" + f + ", ").orElse("") +
            optionalUpdatedAt().map(f -> "updatedAt=" + f + ", ").orElse("") +
            optionalBusinessId().map(f -> "businessId=" + f + ", ").orElse("") +
            optionalPartyId().map(f -> "partyId=" + f + ", ").orElse("") +
            optionalAccountId().map(f -> "accountId=" + f + ", ").orElse("") +
            optionalDistinct().map(f -> "distinct=" + f + ", ").orElse("") +
        "}";
    }
}
