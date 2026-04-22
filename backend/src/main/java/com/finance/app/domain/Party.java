package com.finance.app.domain;

import com.finance.app.domain.enumeration.PartyType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Party.
 */
@Entity
@Table(name = "party")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Party implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Size(min = 2, max = 200)
    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private PartyType type;

    @NotNull
    @Size(max = 10)
    @Pattern(regexp = "^[6-9][0-9]{9}$")
    @Column(name = "mobile", length = 10, nullable = false)
    private String mobile;

    @Size(max = 254)
    @Column(name = "email", length = 254)
    private String email;

    @Size(max = 200)
    @Column(name = "address_line_1", length = 200)
    private String addressLine1;

    @Size(max = 120)
    @Column(name = "address_city", length = 120)
    private String addressCity;

    @Size(max = 80)
    @Column(name = "address_state", length = 80)
    private String addressState;

    @Size(max = 6)
    @Pattern(regexp = "^[1-9][0-9]{5}$")
    @Column(name = "address_pincode", length = 6)
    private String addressPincode;

    @Size(max = 15)
    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
    @Column(name = "gst_number", length = 15)
    private String gstNumber;

    @Size(max = 10)
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
    @Column(name = "pan_number", length = 10)
    private String panNumber;

    @DecimalMin(value = "0")
    @Column(name = "credit_limit", precision = 21, scale = 2)
    private BigDecimal creditLimit;

    @Min(value = 0)
    @Max(value = 3650)
    @Column(name = "payment_terms_days")
    private Integer paymentTermsDays;

    @Column(name = "opening_balance", precision = 21, scale = 2)
    private BigDecimal openingBalance;

    @NotNull
    @Column(name = "balance", precision = 21, scale = 2, nullable = false)
    private BigDecimal balance;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted")
    private Boolean deleted;

    @ManyToOne(fetch = FetchType.LAZY)
    private Business business;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Party id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return this.name;
    }

    public Party name(String name) {
        this.setName(name);
        return this;
    }

    public void setName(String name) {
        this.name = name;
    }

    public PartyType getType() {
        return this.type;
    }

    public Party type(PartyType type) {
        this.setType(type);
        return this;
    }

    public void setType(PartyType type) {
        this.type = type;
    }

    public String getMobile() {
        return this.mobile;
    }

    public Party mobile(String mobile) {
        this.setMobile(mobile);
        return this;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getEmail() {
        return this.email;
    }

    public Party email(String email) {
        this.setEmail(email);
        return this;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddressLine1() {
        return this.addressLine1;
    }

    public Party addressLine1(String addressLine1) {
        this.setAddressLine1(addressLine1);
        return this;
    }

    public void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
    }

    public String getAddressCity() {
        return this.addressCity;
    }

    public Party addressCity(String addressCity) {
        this.setAddressCity(addressCity);
        return this;
    }

    public void setAddressCity(String addressCity) {
        this.addressCity = addressCity;
    }

    public String getAddressState() {
        return this.addressState;
    }

    public Party addressState(String addressState) {
        this.setAddressState(addressState);
        return this;
    }

    public void setAddressState(String addressState) {
        this.addressState = addressState;
    }

    public String getAddressPincode() {
        return this.addressPincode;
    }

    public Party addressPincode(String addressPincode) {
        this.setAddressPincode(addressPincode);
        return this;
    }

    public void setAddressPincode(String addressPincode) {
        this.addressPincode = addressPincode;
    }

    public String getGstNumber() {
        return this.gstNumber;
    }

    public Party gstNumber(String gstNumber) {
        this.setGstNumber(gstNumber);
        return this;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public String getPanNumber() {
        return this.panNumber;
    }

    public Party panNumber(String panNumber) {
        this.setPanNumber(panNumber);
        return this;
    }

    public void setPanNumber(String panNumber) {
        this.panNumber = panNumber;
    }

    public BigDecimal getCreditLimit() {
        return this.creditLimit;
    }

    public Party creditLimit(BigDecimal creditLimit) {
        this.setCreditLimit(creditLimit);
        return this;
    }

    public void setCreditLimit(BigDecimal creditLimit) {
        this.creditLimit = creditLimit;
    }

    public Integer getPaymentTermsDays() {
        return this.paymentTermsDays;
    }

    public Party paymentTermsDays(Integer paymentTermsDays) {
        this.setPaymentTermsDays(paymentTermsDays);
        return this;
    }

    public void setPaymentTermsDays(Integer paymentTermsDays) {
        this.paymentTermsDays = paymentTermsDays;
    }

    public BigDecimal getOpeningBalance() {
        return this.openingBalance;
    }

    public Party openingBalance(BigDecimal openingBalance) {
        this.setOpeningBalance(openingBalance);
        return this;
    }

    public void setOpeningBalance(BigDecimal openingBalance) {
        this.openingBalance = openingBalance;
    }

    public BigDecimal getBalance() {
        return this.balance;
    }

    public Party balance(BigDecimal balance) {
        this.setBalance(balance);
        return this;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public Party createdAt(Instant createdAt) {
        this.setCreatedAt(createdAt);
        return this;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return this.updatedAt;
    }

    public Party updatedAt(Instant updatedAt) {
        this.setUpdatedAt(updatedAt);
        return this;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getDeleted() {
        return this.deleted;
    }

    public Party deleted(Boolean deleted) {
        this.setDeleted(deleted);
        return this;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public Business getBusiness() {
        return this.business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    public Party business(Business business) {
        this.setBusiness(business);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Party)) {
            return false;
        }
        return getId() != null && getId().equals(((Party) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Party{" +
            "id=" + getId() +
            ", name='" + getName() + "'" +
            ", type='" + getType() + "'" +
            ", mobile='" + getMobile() + "'" +
            ", email='" + getEmail() + "'" +
            ", addressLine1='" + getAddressLine1() + "'" +
            ", addressCity='" + getAddressCity() + "'" +
            ", addressState='" + getAddressState() + "'" +
            ", addressPincode='" + getAddressPincode() + "'" +
            ", gstNumber='" + getGstNumber() + "'" +
            ", panNumber='" + getPanNumber() + "'" +
            ", creditLimit=" + getCreditLimit() +
            ", paymentTermsDays=" + getPaymentTermsDays() +
            ", openingBalance=" + getOpeningBalance() +
            ", balance=" + getBalance() +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            ", deleted='" + getDeleted() + "'" +
            "}";
    }
}
