package com.finance.app.service.criteria;

import com.finance.app.domain.enumeration.PaymentDirection;
import com.finance.app.domain.enumeration.PaymentMode;
import java.io.Serial;
import java.io.Serializable;
import java.util.Objects;
import java.util.Optional;
import org.springdoc.core.annotations.ParameterObject;
import tech.jhipster.service.Criteria;
import tech.jhipster.service.filter.*;

/**
 * Criteria class for the {@link com.finance.app.domain.Payment} entity. This class is used
 * in {@link com.finance.app.web.rest.PaymentResource} to receive all the possible filtering options from
 * the Http GET request parameters.
 * For example the following could be a valid request:
 * {@code /payments?id.greaterThan=5&attr1.contains=something&attr2.specified=false}
 * As Spring is unable to properly convert the types, unless specific {@link Filter} class are used, we need to use
 * fix type specific filters.
 */
@ParameterObject
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PaymentCriteria implements Serializable, Criteria {

    /**
     * Class for filtering PaymentDirection
     */
    public static class PaymentDirectionFilter extends Filter<PaymentDirection> {

        public PaymentDirectionFilter() {}

        public PaymentDirectionFilter(PaymentDirectionFilter filter) {
            super(filter);
        }

        @Override
        public PaymentDirectionFilter copy() {
            return new PaymentDirectionFilter(this);
        }
    }

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

    private PaymentDirectionFilter direction;

    private InstantFilter date;

    private BigDecimalFilter amount;

    private PaymentModeFilter mode;

    private StringFilter reference;

    private StringFilter notes;

    private InstantFilter createdAt;

    private InstantFilter updatedAt;

    private LongFilter allocationsId;

    private LongFilter businessId;

    private LongFilter partyId;

    private LongFilter accountId;

    private Boolean distinct;

    public PaymentCriteria() {}

    public PaymentCriteria(PaymentCriteria other) {
        this.id = other.optionalId().map(LongFilter::copy).orElse(null);
        this.direction = other.optionalDirection().map(PaymentDirectionFilter::copy).orElse(null);
        this.date = other.optionalDate().map(InstantFilter::copy).orElse(null);
        this.amount = other.optionalAmount().map(BigDecimalFilter::copy).orElse(null);
        this.mode = other.optionalMode().map(PaymentModeFilter::copy).orElse(null);
        this.reference = other.optionalReference().map(StringFilter::copy).orElse(null);
        this.notes = other.optionalNotes().map(StringFilter::copy).orElse(null);
        this.createdAt = other.optionalCreatedAt().map(InstantFilter::copy).orElse(null);
        this.updatedAt = other.optionalUpdatedAt().map(InstantFilter::copy).orElse(null);
        this.allocationsId = other.optionalAllocationsId().map(LongFilter::copy).orElse(null);
        this.businessId = other.optionalBusinessId().map(LongFilter::copy).orElse(null);
        this.partyId = other.optionalPartyId().map(LongFilter::copy).orElse(null);
        this.accountId = other.optionalAccountId().map(LongFilter::copy).orElse(null);
        this.distinct = other.distinct;
    }

    @Override
    public PaymentCriteria copy() {
        return new PaymentCriteria(this);
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

    public PaymentDirectionFilter getDirection() {
        return direction;
    }

    public Optional<PaymentDirectionFilter> optionalDirection() {
        return Optional.ofNullable(direction);
    }

    public PaymentDirectionFilter direction() {
        if (direction == null) {
            setDirection(new PaymentDirectionFilter());
        }
        return direction;
    }

    public void setDirection(PaymentDirectionFilter direction) {
        this.direction = direction;
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

    public LongFilter getAllocationsId() {
        return allocationsId;
    }

    public Optional<LongFilter> optionalAllocationsId() {
        return Optional.ofNullable(allocationsId);
    }

    public LongFilter allocationsId() {
        if (allocationsId == null) {
            setAllocationsId(new LongFilter());
        }
        return allocationsId;
    }

    public void setAllocationsId(LongFilter allocationsId) {
        this.allocationsId = allocationsId;
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
        final PaymentCriteria that = (PaymentCriteria) o;
        return (
            Objects.equals(id, that.id) &&
            Objects.equals(direction, that.direction) &&
            Objects.equals(date, that.date) &&
            Objects.equals(amount, that.amount) &&
            Objects.equals(mode, that.mode) &&
            Objects.equals(reference, that.reference) &&
            Objects.equals(notes, that.notes) &&
            Objects.equals(createdAt, that.createdAt) &&
            Objects.equals(updatedAt, that.updatedAt) &&
            Objects.equals(allocationsId, that.allocationsId) &&
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
            direction,
            date,
            amount,
            mode,
            reference,
            notes,
            createdAt,
            updatedAt,
            allocationsId,
            businessId,
            partyId,
            accountId,
            distinct
        );
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PaymentCriteria{" +
            optionalId().map(f -> "id=" + f + ", ").orElse("") +
            optionalDirection().map(f -> "direction=" + f + ", ").orElse("") +
            optionalDate().map(f -> "date=" + f + ", ").orElse("") +
            optionalAmount().map(f -> "amount=" + f + ", ").orElse("") +
            optionalMode().map(f -> "mode=" + f + ", ").orElse("") +
            optionalReference().map(f -> "reference=" + f + ", ").orElse("") +
            optionalNotes().map(f -> "notes=" + f + ", ").orElse("") +
            optionalCreatedAt().map(f -> "createdAt=" + f + ", ").orElse("") +
            optionalUpdatedAt().map(f -> "updatedAt=" + f + ", ").orElse("") +
            optionalAllocationsId().map(f -> "allocationsId=" + f + ", ").orElse("") +
            optionalBusinessId().map(f -> "businessId=" + f + ", ").orElse("") +
            optionalPartyId().map(f -> "partyId=" + f + ", ").orElse("") +
            optionalAccountId().map(f -> "accountId=" + f + ", ").orElse("") +
            optionalDistinct().map(f -> "distinct=" + f + ", ").orElse("") +
        "}";
    }
}
