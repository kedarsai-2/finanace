package com.finance.app.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Business.
 */
@Entity
@Table(name = "business")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Business implements Serializable {

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

    @Size(max = 120)
    @Column(name = "owner_name", length = 120)
    private String ownerName;

    @NotNull
    @Size(max = 10)
    @Pattern(regexp = "^[6-9][0-9]{9}$")
    @Column(name = "mobile", length = 10, nullable = false)
    private String mobile;

    @Size(max = 254)
    @Column(name = "email", length = 254)
    private String email;

    @Size(max = 1024)
    @Column(name = "logo_url", length = 1024)
    private String logoUrl;

    @Size(max = 15)
    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
    @Column(name = "gst_number", length = 15)
    private String gstNumber;

    @Size(max = 10)
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
    @Column(name = "pan_number", length = 10)
    private String panNumber;

    @NotNull
    @Size(max = 120)
    @Column(name = "city", length = 120, nullable = false)
    private String city;

    @NotNull
    @Size(max = 80)
    @Column(name = "state", length = 80, nullable = false)
    private String state;

    @Size(max = 200)
    @Column(name = "billing_line_1", length = 200)
    private String billingLine1;

    @Size(max = 200)
    @Column(name = "billing_line_2", length = 200)
    private String billingLine2;

    @Size(max = 120)
    @Column(name = "billing_city", length = 120)
    private String billingCity;

    @Size(max = 80)
    @Column(name = "billing_state", length = 80)
    private String billingState;

    @Size(max = 6)
    @Pattern(regexp = "^[1-9][0-9]{5}$")
    @Column(name = "billing_pincode", length = 6)
    private String billingPincode;

    @Size(max = 200)
    @Column(name = "shipping_line_1", length = 200)
    private String shippingLine1;

    @Size(max = 200)
    @Column(name = "shipping_line_2", length = 200)
    private String shippingLine2;

    @Size(max = 120)
    @Column(name = "shipping_city", length = 120)
    private String shippingCity;

    @Size(max = 80)
    @Column(name = "shipping_state", length = 80)
    private String shippingState;

    @Size(max = 6)
    @Pattern(regexp = "^[1-9][0-9]{5}$")
    @Column(name = "shipping_pincode", length = 6)
    private String shippingPincode;

    @Column(name = "shipping_same_as_billing")
    private Boolean shippingSameAsBilling;

    @Size(max = 3)
    @Column(name = "currency", length = 3)
    private String currency;

    @Min(value = 1)
    @Max(value = 12)
    @Column(name = "fy_start_month")
    private Integer fyStartMonth;

    @Column(name = "has_data")
    private Boolean hasData;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
        if (this.shippingSameAsBilling == null) {
            this.shippingSameAsBilling = Boolean.TRUE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return this.id;
    }

    public Business id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return this.name;
    }

    public Business name(String name) {
        this.setName(name);
        return this;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getOwnerName() {
        return this.ownerName;
    }

    public Business ownerName(String ownerName) {
        this.setOwnerName(ownerName);
        return this;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getMobile() {
        return this.mobile;
    }

    public Business mobile(String mobile) {
        this.setMobile(mobile);
        return this;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getEmail() {
        return this.email;
    }

    public Business email(String email) {
        this.setEmail(email);
        return this;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getLogoUrl() {
        return this.logoUrl;
    }

    public Business logoUrl(String logoUrl) {
        this.setLogoUrl(logoUrl);
        return this;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getGstNumber() {
        return this.gstNumber;
    }

    public Business gstNumber(String gstNumber) {
        this.setGstNumber(gstNumber);
        return this;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public String getPanNumber() {
        return this.panNumber;
    }

    public Business panNumber(String panNumber) {
        this.setPanNumber(panNumber);
        return this;
    }

    public void setPanNumber(String panNumber) {
        this.panNumber = panNumber;
    }

    public String getCity() {
        return this.city;
    }

    public Business city(String city) {
        this.setCity(city);
        return this;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return this.state;
    }

    public Business state(String state) {
        this.setState(state);
        return this;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getBillingLine1() {
        return this.billingLine1;
    }

    public Business billingLine1(String billingLine1) {
        this.setBillingLine1(billingLine1);
        return this;
    }

    public void setBillingLine1(String billingLine1) {
        this.billingLine1 = billingLine1;
    }

    public String getBillingLine2() {
        return this.billingLine2;
    }

    public Business billingLine2(String billingLine2) {
        this.setBillingLine2(billingLine2);
        return this;
    }

    public void setBillingLine2(String billingLine2) {
        this.billingLine2 = billingLine2;
    }

    public String getBillingCity() {
        return this.billingCity;
    }

    public Business billingCity(String billingCity) {
        this.setBillingCity(billingCity);
        return this;
    }

    public void setBillingCity(String billingCity) {
        this.billingCity = billingCity;
    }

    public String getBillingState() {
        return this.billingState;
    }

    public Business billingState(String billingState) {
        this.setBillingState(billingState);
        return this;
    }

    public void setBillingState(String billingState) {
        this.billingState = billingState;
    }

    public String getBillingPincode() {
        return this.billingPincode;
    }

    public Business billingPincode(String billingPincode) {
        this.setBillingPincode(billingPincode);
        return this;
    }

    public void setBillingPincode(String billingPincode) {
        this.billingPincode = billingPincode;
    }

    public String getShippingLine1() {
        return this.shippingLine1;
    }

    public Business shippingLine1(String shippingLine1) {
        this.setShippingLine1(shippingLine1);
        return this;
    }

    public void setShippingLine1(String shippingLine1) {
        this.shippingLine1 = shippingLine1;
    }

    public String getShippingLine2() {
        return this.shippingLine2;
    }

    public Business shippingLine2(String shippingLine2) {
        this.setShippingLine2(shippingLine2);
        return this;
    }

    public void setShippingLine2(String shippingLine2) {
        this.shippingLine2 = shippingLine2;
    }

    public String getShippingCity() {
        return this.shippingCity;
    }

    public Business shippingCity(String shippingCity) {
        this.setShippingCity(shippingCity);
        return this;
    }

    public void setShippingCity(String shippingCity) {
        this.shippingCity = shippingCity;
    }

    public String getShippingState() {
        return this.shippingState;
    }

    public Business shippingState(String shippingState) {
        this.setShippingState(shippingState);
        return this;
    }

    public void setShippingState(String shippingState) {
        this.shippingState = shippingState;
    }

    public String getShippingPincode() {
        return this.shippingPincode;
    }

    public Business shippingPincode(String shippingPincode) {
        this.setShippingPincode(shippingPincode);
        return this;
    }

    public void setShippingPincode(String shippingPincode) {
        this.shippingPincode = shippingPincode;
    }

    public Boolean getShippingSameAsBilling() {
        return this.shippingSameAsBilling;
    }

    public Business shippingSameAsBilling(Boolean shippingSameAsBilling) {
        this.setShippingSameAsBilling(shippingSameAsBilling);
        return this;
    }

    public void setShippingSameAsBilling(Boolean shippingSameAsBilling) {
        this.shippingSameAsBilling = shippingSameAsBilling;
    }

    public String getCurrency() {
        return this.currency;
    }

    public Business currency(String currency) {
        this.setCurrency(currency);
        return this;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Integer getFyStartMonth() {
        return this.fyStartMonth;
    }

    public Business fyStartMonth(Integer fyStartMonth) {
        this.setFyStartMonth(fyStartMonth);
        return this;
    }

    public void setFyStartMonth(Integer fyStartMonth) {
        this.fyStartMonth = fyStartMonth;
    }

    public Boolean getHasData() {
        return this.hasData;
    }

    public Business hasData(Boolean hasData) {
        this.setHasData(hasData);
        return this;
    }

    public void setHasData(Boolean hasData) {
        this.hasData = hasData;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public Business createdAt(Instant createdAt) {
        this.setCreatedAt(createdAt);
        return this;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return this.updatedAt;
    }

    public Business updatedAt(Instant updatedAt) {
        this.setUpdatedAt(updatedAt);
        return this;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Business)) {
            return false;
        }
        return getId() != null && getId().equals(((Business) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Business{" +
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
