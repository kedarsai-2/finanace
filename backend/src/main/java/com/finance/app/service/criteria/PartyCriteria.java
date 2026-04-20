package com.finance.app.service.criteria;

import com.finance.app.domain.enumeration.PartyType;
import java.io.Serial;
import java.io.Serializable;
import java.util.Objects;
import java.util.Optional;
import org.springdoc.core.annotations.ParameterObject;
import tech.jhipster.service.Criteria;
import tech.jhipster.service.filter.*;

/**
 * Criteria class for the {@link com.finance.app.domain.Party} entity. This class is used
 * in {@link com.finance.app.web.rest.PartyResource} to receive all the possible filtering options from
 * the Http GET request parameters.
 * For example the following could be a valid request:
 * {@code /parties?id.greaterThan=5&attr1.contains=something&attr2.specified=false}
 * As Spring is unable to properly convert the types, unless specific {@link Filter} class are used, we need to use
 * fix type specific filters.
 */
@ParameterObject
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PartyCriteria implements Serializable, Criteria {

    /**
     * Class for filtering PartyType
     */
    public static class PartyTypeFilter extends Filter<PartyType> {

        public PartyTypeFilter() {}

        public PartyTypeFilter(PartyTypeFilter filter) {
            super(filter);
        }

        @Override
        public PartyTypeFilter copy() {
            return new PartyTypeFilter(this);
        }
    }

    @Serial
    private static final long serialVersionUID = 1L;

    private LongFilter id;

    private StringFilter name;

    private PartyTypeFilter type;

    private StringFilter mobile;

    private StringFilter email;

    private StringFilter addressLine1;

    private StringFilter addressCity;

    private StringFilter addressState;

    private StringFilter addressPincode;

    private StringFilter gstNumber;

    private StringFilter panNumber;

    private BigDecimalFilter creditLimit;

    private IntegerFilter paymentTermsDays;

    private BigDecimalFilter openingBalance;

    private BigDecimalFilter balance;

    private InstantFilter createdAt;

    private InstantFilter updatedAt;

    private BooleanFilter deleted;

    private LongFilter businessId;

    private Boolean distinct;

    public PartyCriteria() {}

    public PartyCriteria(PartyCriteria other) {
        this.id = other.optionalId().map(LongFilter::copy).orElse(null);
        this.name = other.optionalName().map(StringFilter::copy).orElse(null);
        this.type = other.optionalType().map(PartyTypeFilter::copy).orElse(null);
        this.mobile = other.optionalMobile().map(StringFilter::copy).orElse(null);
        this.email = other.optionalEmail().map(StringFilter::copy).orElse(null);
        this.addressLine1 = other.optionalAddressLine1().map(StringFilter::copy).orElse(null);
        this.addressCity = other.optionalAddressCity().map(StringFilter::copy).orElse(null);
        this.addressState = other.optionalAddressState().map(StringFilter::copy).orElse(null);
        this.addressPincode = other.optionalAddressPincode().map(StringFilter::copy).orElse(null);
        this.gstNumber = other.optionalGstNumber().map(StringFilter::copy).orElse(null);
        this.panNumber = other.optionalPanNumber().map(StringFilter::copy).orElse(null);
        this.creditLimit = other.optionalCreditLimit().map(BigDecimalFilter::copy).orElse(null);
        this.paymentTermsDays = other.optionalPaymentTermsDays().map(IntegerFilter::copy).orElse(null);
        this.openingBalance = other.optionalOpeningBalance().map(BigDecimalFilter::copy).orElse(null);
        this.balance = other.optionalBalance().map(BigDecimalFilter::copy).orElse(null);
        this.createdAt = other.optionalCreatedAt().map(InstantFilter::copy).orElse(null);
        this.updatedAt = other.optionalUpdatedAt().map(InstantFilter::copy).orElse(null);
        this.deleted = other.optionalDeleted().map(BooleanFilter::copy).orElse(null);
        this.businessId = other.optionalBusinessId().map(LongFilter::copy).orElse(null);
        this.distinct = other.distinct;
    }

    @Override
    public PartyCriteria copy() {
        return new PartyCriteria(this);
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

    public PartyTypeFilter getType() {
        return type;
    }

    public Optional<PartyTypeFilter> optionalType() {
        return Optional.ofNullable(type);
    }

    public PartyTypeFilter type() {
        if (type == null) {
            setType(new PartyTypeFilter());
        }
        return type;
    }

    public void setType(PartyTypeFilter type) {
        this.type = type;
    }

    public StringFilter getMobile() {
        return mobile;
    }

    public Optional<StringFilter> optionalMobile() {
        return Optional.ofNullable(mobile);
    }

    public StringFilter mobile() {
        if (mobile == null) {
            setMobile(new StringFilter());
        }
        return mobile;
    }

    public void setMobile(StringFilter mobile) {
        this.mobile = mobile;
    }

    public StringFilter getEmail() {
        return email;
    }

    public Optional<StringFilter> optionalEmail() {
        return Optional.ofNullable(email);
    }

    public StringFilter email() {
        if (email == null) {
            setEmail(new StringFilter());
        }
        return email;
    }

    public void setEmail(StringFilter email) {
        this.email = email;
    }

    public StringFilter getAddressLine1() {
        return addressLine1;
    }

    public Optional<StringFilter> optionalAddressLine1() {
        return Optional.ofNullable(addressLine1);
    }

    public StringFilter addressLine1() {
        if (addressLine1 == null) {
            setAddressLine1(new StringFilter());
        }
        return addressLine1;
    }

    public void setAddressLine1(StringFilter addressLine1) {
        this.addressLine1 = addressLine1;
    }

    public StringFilter getAddressCity() {
        return addressCity;
    }

    public Optional<StringFilter> optionalAddressCity() {
        return Optional.ofNullable(addressCity);
    }

    public StringFilter addressCity() {
        if (addressCity == null) {
            setAddressCity(new StringFilter());
        }
        return addressCity;
    }

    public void setAddressCity(StringFilter addressCity) {
        this.addressCity = addressCity;
    }

    public StringFilter getAddressState() {
        return addressState;
    }

    public Optional<StringFilter> optionalAddressState() {
        return Optional.ofNullable(addressState);
    }

    public StringFilter addressState() {
        if (addressState == null) {
            setAddressState(new StringFilter());
        }
        return addressState;
    }

    public void setAddressState(StringFilter addressState) {
        this.addressState = addressState;
    }

    public StringFilter getAddressPincode() {
        return addressPincode;
    }

    public Optional<StringFilter> optionalAddressPincode() {
        return Optional.ofNullable(addressPincode);
    }

    public StringFilter addressPincode() {
        if (addressPincode == null) {
            setAddressPincode(new StringFilter());
        }
        return addressPincode;
    }

    public void setAddressPincode(StringFilter addressPincode) {
        this.addressPincode = addressPincode;
    }

    public StringFilter getGstNumber() {
        return gstNumber;
    }

    public Optional<StringFilter> optionalGstNumber() {
        return Optional.ofNullable(gstNumber);
    }

    public StringFilter gstNumber() {
        if (gstNumber == null) {
            setGstNumber(new StringFilter());
        }
        return gstNumber;
    }

    public void setGstNumber(StringFilter gstNumber) {
        this.gstNumber = gstNumber;
    }

    public StringFilter getPanNumber() {
        return panNumber;
    }

    public Optional<StringFilter> optionalPanNumber() {
        return Optional.ofNullable(panNumber);
    }

    public StringFilter panNumber() {
        if (panNumber == null) {
            setPanNumber(new StringFilter());
        }
        return panNumber;
    }

    public void setPanNumber(StringFilter panNumber) {
        this.panNumber = panNumber;
    }

    public BigDecimalFilter getCreditLimit() {
        return creditLimit;
    }

    public Optional<BigDecimalFilter> optionalCreditLimit() {
        return Optional.ofNullable(creditLimit);
    }

    public BigDecimalFilter creditLimit() {
        if (creditLimit == null) {
            setCreditLimit(new BigDecimalFilter());
        }
        return creditLimit;
    }

    public void setCreditLimit(BigDecimalFilter creditLimit) {
        this.creditLimit = creditLimit;
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

    public BigDecimalFilter getBalance() {
        return balance;
    }

    public Optional<BigDecimalFilter> optionalBalance() {
        return Optional.ofNullable(balance);
    }

    public BigDecimalFilter balance() {
        if (balance == null) {
            setBalance(new BigDecimalFilter());
        }
        return balance;
    }

    public void setBalance(BigDecimalFilter balance) {
        this.balance = balance;
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
        final PartyCriteria that = (PartyCriteria) o;
        return (
            Objects.equals(id, that.id) &&
            Objects.equals(name, that.name) &&
            Objects.equals(type, that.type) &&
            Objects.equals(mobile, that.mobile) &&
            Objects.equals(email, that.email) &&
            Objects.equals(addressLine1, that.addressLine1) &&
            Objects.equals(addressCity, that.addressCity) &&
            Objects.equals(addressState, that.addressState) &&
            Objects.equals(addressPincode, that.addressPincode) &&
            Objects.equals(gstNumber, that.gstNumber) &&
            Objects.equals(panNumber, that.panNumber) &&
            Objects.equals(creditLimit, that.creditLimit) &&
            Objects.equals(paymentTermsDays, that.paymentTermsDays) &&
            Objects.equals(openingBalance, that.openingBalance) &&
            Objects.equals(balance, that.balance) &&
            Objects.equals(createdAt, that.createdAt) &&
            Objects.equals(updatedAt, that.updatedAt) &&
            Objects.equals(deleted, that.deleted) &&
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
            mobile,
            email,
            addressLine1,
            addressCity,
            addressState,
            addressPincode,
            gstNumber,
            panNumber,
            creditLimit,
            paymentTermsDays,
            openingBalance,
            balance,
            createdAt,
            updatedAt,
            deleted,
            businessId,
            distinct
        );
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PartyCriteria{" +
            optionalId().map(f -> "id=" + f + ", ").orElse("") +
            optionalName().map(f -> "name=" + f + ", ").orElse("") +
            optionalType().map(f -> "type=" + f + ", ").orElse("") +
            optionalMobile().map(f -> "mobile=" + f + ", ").orElse("") +
            optionalEmail().map(f -> "email=" + f + ", ").orElse("") +
            optionalAddressLine1().map(f -> "addressLine1=" + f + ", ").orElse("") +
            optionalAddressCity().map(f -> "addressCity=" + f + ", ").orElse("") +
            optionalAddressState().map(f -> "addressState=" + f + ", ").orElse("") +
            optionalAddressPincode().map(f -> "addressPincode=" + f + ", ").orElse("") +
            optionalGstNumber().map(f -> "gstNumber=" + f + ", ").orElse("") +
            optionalPanNumber().map(f -> "panNumber=" + f + ", ").orElse("") +
            optionalCreditLimit().map(f -> "creditLimit=" + f + ", ").orElse("") +
            optionalPaymentTermsDays().map(f -> "paymentTermsDays=" + f + ", ").orElse("") +
            optionalOpeningBalance().map(f -> "openingBalance=" + f + ", ").orElse("") +
            optionalBalance().map(f -> "balance=" + f + ", ").orElse("") +
            optionalCreatedAt().map(f -> "createdAt=" + f + ", ").orElse("") +
            optionalUpdatedAt().map(f -> "updatedAt=" + f + ", ").orElse("") +
            optionalDeleted().map(f -> "deleted=" + f + ", ").orElse("") +
            optionalBusinessId().map(f -> "businessId=" + f + ", ").orElse("") +
            optionalDistinct().map(f -> "distinct=" + f + ", ").orElse("") +
        "}";
    }
}
