package com.finance.app.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.finance.app.domain.Business} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class BusinessDTO implements Serializable {

    private Long id;

    @NotNull
    @Size(min = 2, max = 200)
    private String name;

    @Size(max = 120)
    private String ownerName;

    @NotNull
    @Size(max = 10)
    @Pattern(regexp = "^[6-9][0-9]{9}$")
    private String mobile;

    @Size(max = 254)
    private String email;

    @Size(max = 1024)
    private String logoUrl;

    @Size(max = 15)
    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
    private String gstNumber;

    @Size(max = 10)
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
    private String panNumber;

    @NotNull
    @Size(max = 120)
    private String city;

    @NotNull
    @Size(max = 80)
    private String state;

    @Size(max = 200)
    private String billingLine1;

    @Size(max = 200)
    private String billingLine2;

    @Size(max = 120)
    private String billingCity;

    @Size(max = 80)
    private String billingState;

    @Size(max = 6)
    @Pattern(regexp = "^[1-9][0-9]{5}$")
    private String billingPincode;

    @Size(max = 200)
    private String shippingLine1;

    @Size(max = 200)
    private String shippingLine2;

    @Size(max = 120)
    private String shippingCity;

    @Size(max = 80)
    private String shippingState;

    @Size(max = 6)
    @Pattern(regexp = "^[1-9][0-9]{5}$")
    private String shippingPincode;

    private Boolean shippingSameAsBilling;

    @Size(max = 3)
    private String currency;

    @Min(value = 1)
    @Max(value = 12)
    private Integer fyStartMonth;

    private Boolean hasData;

    private Instant createdAt;

    private Instant updatedAt;

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

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
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

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
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

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getBillingLine1() {
        return billingLine1;
    }

    public void setBillingLine1(String billingLine1) {
        this.billingLine1 = billingLine1;
    }

    public String getBillingLine2() {
        return billingLine2;
    }

    public void setBillingLine2(String billingLine2) {
        this.billingLine2 = billingLine2;
    }

    public String getBillingCity() {
        return billingCity;
    }

    public void setBillingCity(String billingCity) {
        this.billingCity = billingCity;
    }

    public String getBillingState() {
        return billingState;
    }

    public void setBillingState(String billingState) {
        this.billingState = billingState;
    }

    public String getBillingPincode() {
        return billingPincode;
    }

    public void setBillingPincode(String billingPincode) {
        this.billingPincode = billingPincode;
    }

    public String getShippingLine1() {
        return shippingLine1;
    }

    public void setShippingLine1(String shippingLine1) {
        this.shippingLine1 = shippingLine1;
    }

    public String getShippingLine2() {
        return shippingLine2;
    }

    public void setShippingLine2(String shippingLine2) {
        this.shippingLine2 = shippingLine2;
    }

    public String getShippingCity() {
        return shippingCity;
    }

    public void setShippingCity(String shippingCity) {
        this.shippingCity = shippingCity;
    }

    public String getShippingState() {
        return shippingState;
    }

    public void setShippingState(String shippingState) {
        this.shippingState = shippingState;
    }

    public String getShippingPincode() {
        return shippingPincode;
    }

    public void setShippingPincode(String shippingPincode) {
        this.shippingPincode = shippingPincode;
    }

    public Boolean getShippingSameAsBilling() {
        return shippingSameAsBilling;
    }

    public void setShippingSameAsBilling(Boolean shippingSameAsBilling) {
        this.shippingSameAsBilling = shippingSameAsBilling;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Integer getFyStartMonth() {
        return fyStartMonth;
    }

    public void setFyStartMonth(Integer fyStartMonth) {
        this.fyStartMonth = fyStartMonth;
    }

    public Boolean getHasData() {
        return hasData;
    }

    public void setHasData(Boolean hasData) {
        this.hasData = hasData;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof BusinessDTO)) {
            return false;
        }

        BusinessDTO businessDTO = (BusinessDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, businessDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "BusinessDTO{" +
            "id=" + getId() +
            ", name='" + getName() + "'" +
            ", ownerName='" + getOwnerName() + "'" +
            ", mobile='" + getMobile() + "'" +
            ", email='" + getEmail() + "'" +
            ", logoUrl='" + getLogoUrl() + "'" +
            ", gstNumber='" + getGstNumber() + "'" +
            ", panNumber='" + getPanNumber() + "'" +
            ", city='" + getCity() + "'" +
            ", state='" + getState() + "'" +
            ", billingLine1='" + getBillingLine1() + "'" +
            ", billingLine2='" + getBillingLine2() + "'" +
            ", billingCity='" + getBillingCity() + "'" +
            ", billingState='" + getBillingState() + "'" +
            ", billingPincode='" + getBillingPincode() + "'" +
            ", shippingLine1='" + getShippingLine1() + "'" +
            ", shippingLine2='" + getShippingLine2() + "'" +
            ", shippingCity='" + getShippingCity() + "'" +
            ", shippingState='" + getShippingState() + "'" +
            ", shippingPincode='" + getShippingPincode() + "'" +
            ", shippingSameAsBilling='" + getShippingSameAsBilling() + "'" +
            ", currency='" + getCurrency() + "'" +
            ", fyStartMonth=" + getFyStartMonth() +
            ", hasData='" + getHasData() + "'" +
            ", createdAt='" + getCreatedAt() + "'" +
            ", updatedAt='" + getUpdatedAt() + "'" +
            "}";
    }
}
