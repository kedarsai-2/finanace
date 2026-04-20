package com.finance.app.service.criteria;

import com.finance.app.domain.enumeration.AccountType;
import java.io.Serial;
import java.io.Serializable;
import java.util.Objects;
import java.util.Optional;
import org.springdoc.core.annotations.ParameterObject;
import tech.jhipster.service.Criteria;
import tech.jhipster.service.filter.*;

/**
 * Criteria class for the {@link com.finance.app.domain.Account} entity. This class is used
 * in {@link com.finance.app.web.rest.AccountResource} to receive all the possible filtering options from
 * the Http GET request parameters.
 * For example the following could be a valid request:
 * {@code /accounts?id.greaterThan=5&attr1.contains=something&attr2.specified=false}
 * As Spring is unable to properly convert the types, unless specific {@link Filter} class are used, we need to use
 * fix type specific filters.
 */
@ParameterObject
@SuppressWarnings("common-java:DuplicatedBlocks")
public class AccountCriteria implements Serializable, Criteria {

    /**
     * Class for filtering AccountType
     */
    public static class AccountTypeFilter extends Filter<AccountType> {

        public AccountTypeFilter() {}

        public AccountTypeFilter(AccountTypeFilter filter) {
            super(filter);
        }

        @Override
        public AccountTypeFilter copy() {
            return new AccountTypeFilter(this);
        }
    }

    @Serial
    private static final long serialVersionUID = 1L;

    private LongFilter id;

    private StringFilter name;

    private AccountTypeFilter type;

    private BigDecimalFilter openingBalance;

    private StringFilter accountNumber;

    private StringFilter ifsc;

    private StringFilter upiId;

    private StringFilter notes;

    private BooleanFilter deleted;

    private InstantFilter createdAt;

    private InstantFilter updatedAt;

    private LongFilter businessId;

    private Boolean distinct;

    public AccountCriteria() {}

    public AccountCriteria(AccountCriteria other) {
        this.id = other.optionalId().map(LongFilter::copy).orElse(null);
        this.name = other.optionalName().map(StringFilter::copy).orElse(null);
        this.type = other.optionalType().map(AccountTypeFilter::copy).orElse(null);
        this.openingBalance = other.optionalOpeningBalance().map(BigDecimalFilter::copy).orElse(null);
        this.accountNumber = other.optionalAccountNumber().map(StringFilter::copy).orElse(null);
        this.ifsc = other.optionalIfsc().map(StringFilter::copy).orElse(null);
        this.upiId = other.optionalUpiId().map(StringFilter::copy).orElse(null);
        this.notes = other.optionalNotes().map(StringFilter::copy).orElse(null);
        this.deleted = other.optionalDeleted().map(BooleanFilter::copy).orElse(null);
        this.createdAt = other.optionalCreatedAt().map(InstantFilter::copy).orElse(null);
        this.updatedAt = other.optionalUpdatedAt().map(InstantFilter::copy).orElse(null);
        this.businessId = other.optionalBusinessId().map(LongFilter::copy).orElse(null);
        this.distinct = other.distinct;
    }

    @Override
    public AccountCriteria copy() {
        return new AccountCriteria(this);
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

    public StringFilter getName() {
        return name;
    }

    public Optional<StringFilter> optionalName() {
        return Optional.ofNullable(name);
    }

    public StringFilter name() {
        if (name == null) {
            setName(new StringFilter());
        }
        return name;
    }

    public void setName(StringFilter name) {
        this.name = name;
    }

    public AccountTypeFilter getType() {
        return type;
    }

    public Optional<AccountTypeFilter> optionalType() {
        return Optional.ofNullable(type);
    }

    public AccountTypeFilter type() {
        if (type == null) {
            setType(new AccountTypeFilter());
        }
        return type;
    }

    public void setType(AccountTypeFilter type) {
        this.type = type;
    }

    public BigDecimalFilter getOpeningBalance() {
        return openingBalance;
    }

    public Optional<BigDecimalFilter> optionalOpeningBalance() {
        return Optional.ofNullable(openingBalance);
    }

    public BigDecimalFilter openingBalance() {
        if (openingBalance == null) {
            setOpeningBalance(new BigDecimalFilter());
        }
        return openingBalance;
    }

    public void setOpeningBalance(BigDecimalFilter openingBalance) {
        this.openingBalance = openingBalance;
    }

    public StringFilter getAccountNumber() {
        return accountNumber;
    }

    public Optional<StringFilter> optionalAccountNumber() {
        return Optional.ofNullable(accountNumber);
    }

    public StringFilter accountNumber() {
        if (accountNumber == null) {
            setAccountNumber(new StringFilter());
        }
        return accountNumber;
    }

    public void setAccountNumber(StringFilter accountNumber) {
        this.accountNumber = accountNumber;
    }

    public StringFilter getIfsc() {
        return ifsc;
    }

    public Optional<StringFilter> optionalIfsc() {
        return Optional.ofNullable(ifsc);
    }

    public StringFilter ifsc() {
        if (ifsc == null) {
            setIfsc(new StringFilter());
        }
        return ifsc;
    }

    public void setIfsc(StringFilter ifsc) {
        this.ifsc = ifsc;
    }

    public StringFilter getUpiId() {
        return upiId;
    }

    public Optional<StringFilter> optionalUpiId() {
        return Optional.ofNullable(upiId);
    }

    public StringFilter upiId() {
        if (upiId == null) {
            setUpiId(new StringFilter());
        }
        return upiId;
    }

    public void setUpiId(StringFilter upiId) {
        this.upiId = upiId;
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
        final AccountCriteria that = (AccountCriteria) o;
        return (
            Objects.equals(id, that.id) &&
            Objects.equals(name, that.name) &&
            Objects.equals(type, that.type) &&
            Objects.equals(openingBalance, that.openingBalance) &&
            Objects.equals(accountNumber, that.accountNumber) &&
            Objects.equals(ifsc, that.ifsc) &&
            Objects.equals(upiId, that.upiId) &&
            Objects.equals(notes, that.notes) &&
            Objects.equals(deleted, that.deleted) &&
            Objects.equals(createdAt, that.createdAt) &&
            Objects.equals(updatedAt, that.updatedAt) &&
            Objects.equals(businessId, that.businessId) &&
            Objects.equals(distinct, that.distinct)
        );
    }

    @Override
    public int hashCode() {
        return Objects.hash(
            id,
            name,
            type,
            openingBalance,
            accountNumber,
            ifsc,
            upiId,
            notes,
            deleted,
            createdAt,
            updatedAt,
            businessId,
            distinct
        );
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "AccountCriteria{" +
            optionalId().map(f -> "id=" + f + ", ").orElse("") +
            optionalName().map(f -> "name=" + f + ", ").orElse("") +
            optionalType().map(f -> "type=" + f + ", ").orElse("") +
            optionalOpeningBalance().map(f -> "openingBalance=" + f + ", ").orElse("") +
            optionalAccountNumber().map(f -> "accountNumber=" + f + ", ").orElse("") +
            optionalIfsc().map(f -> "ifsc=" + f + ", ").orElse("") +
            optionalUpiId().map(f -> "upiId=" + f + ", ").orElse("") +
            optionalNotes().map(f -> "notes=" + f + ", ").orElse("") +
            optionalDeleted().map(f -> "deleted=" + f + ", ").orElse("") +
            optionalCreatedAt().map(f -> "createdAt=" + f + ", ").orElse("") +
            optionalUpdatedAt().map(f -> "updatedAt=" + f + ", ").orElse("") +
            optionalBusinessId().map(f -> "businessId=" + f + ", ").orElse("") +
            optionalDistinct().map(f -> "distinct=" + f + ", ").orElse("") +
        "}";
    }
}
