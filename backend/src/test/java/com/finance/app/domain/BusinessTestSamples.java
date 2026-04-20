package com.finance.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class BusinessTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));
    private static final AtomicInteger intCount = new AtomicInteger(random.nextInt() + (2 * Short.MAX_VALUE));

    public static Business getBusinessSample1() {
        return new Business()
            .id(1L)
            .name("name1")
            .ownerName("ownerName1")
            .mobile("mobile1")
            .email("email1")
            .logoUrl("logoUrl1")
            .gstNumber("gstNumber1")
            .panNumber("panNumber1")
            .city("city1")
            .state("state1")
            .billingLine1("billingLine11")
            .billingLine2("billingLine21")
            .billingCity("billingCity1")
            .billingState("billingState1")
            .billingPincode("billingPincode1")
            .shippingLine1("shippingLine11")
            .shippingLine2("shippingLine21")
            .shippingCity("shippingCity1")
            .shippingState("shippingState1")
            .shippingPincode("shippingPincode1")
            .currency("currency1")
            .fyStartMonth(1);
    }

    public static Business getBusinessSample2() {
        return new Business()
            .id(2L)
            .name("name2")
            .ownerName("ownerName2")
            .mobile("mobile2")
            .email("email2")
            .logoUrl("logoUrl2")
            .gstNumber("gstNumber2")
            .panNumber("panNumber2")
            .city("city2")
            .state("state2")
            .billingLine1("billingLine12")
            .billingLine2("billingLine22")
            .billingCity("billingCity2")
            .billingState("billingState2")
            .billingPincode("billingPincode2")
            .shippingLine1("shippingLine12")
            .shippingLine2("shippingLine22")
            .shippingCity("shippingCity2")
            .shippingState("shippingState2")
            .shippingPincode("shippingPincode2")
            .currency("currency2")
            .fyStartMonth(2);
    }

    public static Business getBusinessRandomSampleGenerator() {
        return new Business()
            .id(longCount.incrementAndGet())
            .name(UUID.randomUUID().toString())
            .ownerName(UUID.randomUUID().toString())
            .mobile(UUID.randomUUID().toString())
            .email(UUID.randomUUID().toString())
            .logoUrl(UUID.randomUUID().toString())
            .gstNumber(UUID.randomUUID().toString())
            .panNumber(UUID.randomUUID().toString())
            .city(UUID.randomUUID().toString())
            .state(UUID.randomUUID().toString())
            .billingLine1(UUID.randomUUID().toString())
            .billingLine2(UUID.randomUUID().toString())
            .billingCity(UUID.randomUUID().toString())
            .billingState(UUID.randomUUID().toString())
            .billingPincode(UUID.randomUUID().toString())
            .shippingLine1(UUID.randomUUID().toString())
            .shippingLine2(UUID.randomUUID().toString())
            .shippingCity(UUID.randomUUID().toString())
            .shippingState(UUID.randomUUID().toString())
            .shippingPincode(UUID.randomUUID().toString())
            .currency(UUID.randomUUID().toString())
            .fyStartMonth(intCount.incrementAndGet());
    }
}
