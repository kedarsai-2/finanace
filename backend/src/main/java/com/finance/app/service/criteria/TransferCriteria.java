package com.finance.app.service.criteria;

import java.io.Serial;
import java.io.Serializable;
import java.util.Objects;
import java.util.Optional;
import org.springdoc.core.annotations.ParameterObject;
import tech.jhipster.service.Criteria;
import tech.jhipster.service.filter.*;

/**
 * Criteria class for the {@link com.finance.app.domain.Transfer} entity. This class is used
 * in {@link com.finance.app.web.rest.TransferResource} to receive all the possible filtering options from
 * the Http GET request parameters.
 * For example the following could be a valid request:
 * {@code /transfers?id.greaterThan=5&attr1.contains=something&attr2.specified=false}
 * As Spring is unable to properly convert the types, unless specific {@link Filter} class are used, we need to use
 * fix type specific filters.
 */
@ParameterObject
@SuppressWarnings("common-java:DuplicatedBlocks")
public class TransferCriteria implements Serializable, Criteria {

    @Serial
    private static final long serialVersionUID = 1L;

    private LongFilter id;

    private InstantFilter date;

    private BigDecimalFilter amount;

    private StringFilter notes;

    private InstantFilter createdAt;

    private InstantFilter updatedAt;

    private LongFilter businessId;

    private LongFilter fromAccountId;

    private LongFilter toAccountId;

    private Boolean distinct;

    public TransferCriteria() {}

    public TransferCriteria(TransferCriteria other) {
        this.id = other.optionalId().map(LongFilter::copy).orElse(null);
        this.date = other.optionalDate().map(InstantFilter::copy).orElse(null);
        this.amount = other.optionalAmount().map(BigDecimalFilter::copy).orElse(null);
        this.notes = other.optionalNotes().map(StringFilter::copy).orElse(null);
        this.createdAt = other.optionalCreatedAt().map(InstantFilter::copy).orElse(null);
        this.updatedAt = other.optionalUpdatedAt().map(InstantFilter::copy).orElse(null);
        this.businessId = other.optionalBusinessId().map(LongFilter::copy).orElse(null);
        this.fromAccountId = other.optionalFromAccountId().map(LongFilter::copy).orElse(null);
        this.toAccountId = other.optionalToAccountId().map(LongFilter::copy).orElse(null);
        this.distinct = other.distinct;
    }

    @Override
    public TransferCriteria copy() {
        return new TransferCriteria(this);
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

    public LongFilter getFromAccountId() {
        return fromAccountId;
    }

    public Optional<LongFilter> optionalFromAccountId() {
        return Optional.ofNullable(fromAccountId);
    }

    public LongFilter fromAccountId() {
        if (fromAccountId == null) {
            setFromAccountId(new LongFilter());
        }
        return fromAccountId;
    }

    public void setFromAccountId(LongFilter fromAccountId) {
        this.fromAccountId = fromAccountId;
    }

    public LongFilter getToAccountId() {
        return toAccountId;
    }

    public Optional<LongFilter> optionalToAccountId() {
        return Optional.ofNullable(toAccountId);
    }

    public LongFilter toAccountId() {
        if (toAccountId == null) {
            setToAccountId(new LongFilter());
        }
        return toAccountId;
    }

    public void setToAccountId(LongFilter toAccountId) {
        this.toAccountId = toAccountId;
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
        final TransferCriteria that = (TransferCriteria) o;
        return (
            Objects.equals(id, that.id) &&
            Objects.equals(date, that.date) &&
            Objects.equals(amount, that.amount) &&
            Objects.equals(notes, that.notes) &&
            Objects.equals(createdAt, that.createdAt) &&
            Objects.equals(updatedAt, that.updatedAt) &&
            Objects.equals(businessId, that.businessId) &&
            Objects.equals(fromAccountId, that.fromAccountId) &&
            Objects.equals(toAccountId, that.toAccountId) &&
            Objects.equals(distinct, that.distinct)
        );
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, date, amount, notes, createdAt, updatedAt, businessId, fromAccountId, toAccountId, distinct);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "TransferCriteria{" +
            optionalId().map(f -> "id=" + f + ", ").orElse("") +
            optionalDate().map(f -> "date=" + f + ", ").orElse("") +
            optionalAmount().map(f -> "amount=" + f + ", ").orElse("") +
            optionalNotes().map(f -> "notes=" + f + ", ").orElse("") +
            optionalCreatedAt().map(f -> "createdAt=" + f + ", ").orElse("") +
            optionalUpdatedAt().map(f -> "updatedAt=" + f + ", ").orElse("") +
            optionalBusinessId().map(f -> "businessId=" + f + ", ").orElse("") +
            optionalFromAccountId().map(f -> "fromAccountId=" + f + ", ").orElse("") +
            optionalToAccountId().map(f -> "toAccountId=" + f + ", ").orElse("") +
            optionalDistinct().map(f -> "distinct=" + f + ", ").orElse("") +
        "}";
    }
}
