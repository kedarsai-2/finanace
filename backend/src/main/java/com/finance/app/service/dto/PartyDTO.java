package com.finance.app.service.dto;

import com.finance.app.domain.enumeration.PartyType;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.finance.app.domain.Party} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PartyDTO implements Serializable {

    private Long id;

    @NotNull
    @Size(min = 2, max = 200)
    private String name;

    @NotNull
    private PartyType type;

    @NotNull
    @Size(max = 10)
    @Pattern(regexp = "^[6-9][0-9]{9}$")
    private String mobile;

    @Size(max = 254)
    private String email;

    @Size(max = 200)
    private String addressLine1;

    @Size(max = 120)
    private String addressCity;

    @Size(max = 80)
    private String addressState;

    @Size(max = 6)
    @Pattern(regexp = "^[1-9][0-9]{5}$")
    private String addressPincode;

    @Size(max = 15)
    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
    private String gstNumber;

    @Size(max = 10)
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
    private String panNumber;

    @DecimalMin(value = "0")
    private BigDecimal creditLimit;

    @Min(value = 0)
    @Max(value = 3650)
    private Integer paymentTermsDays;

    private BigDecimal openingBalance;

    private BigDecimal balance;

    private Instant createdAt;

    private Instant updatedAt;

    private Boolean deleted;

    private BusinessDTO business;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public PartyType getType() {
        return type;
    }

    public void setType(PartyType type) {
        this.type = type;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddressLine1() {
        return addressLine1;
    }

    public void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
    }

    public String getAddressCity() {
        return addressCity;
    }

    public void setAddressCity(String addressCity) {
        this.addressCity = addressCity;
    }

    public String getAddressState() {
        return addressState;
    }

    public void setAddressState(String addressState) {
        this.addressState = addressState;
    }

    public String getAddressPincode() {
        return addressPincode;
    }

    public void setAddressPincode(String addressPincode) {
        this.addressPincode = addressPincode;
    }

    public String getGstNumber() {
        return gstNumber;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public String getPanNumber() {
        return panNumber;
    }

    public void setPanNumber(String panNumber) {
        this.panNumber = panNumber;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public void setCreditLimit(BigDecimal creditLimit) {
        this.creditLimit = creditLimit;
    }

    public Integer getPaymentTermsDays() {
        return paymentTermsDays;
    }

    public void setPaymentTermsDays(Integer paymentTermsDays) {
        this.paymentTermsDays = paymentTermsDays;
    }

    public BigDecimal getOpeningBalance() {
        return openingBalance;
    }

    public void setOpeningBalance(BigDecimal openingBalance) {
        this.openingBalance = openingBalance;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
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

    public Boolean getDeleted() {
        return deleted;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public BusinessDTO getBusiness() {
        return business;
    }

    public void setBusiness(BusinessDTO business) {
        this.business = business;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PartyDTO)) {
            return false;
        }

        PartyDTO partyDTO = (PartyDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, partyDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PartyDTO{" +
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
            ", business=" + getBusiness() +
            "}";
    }
}
