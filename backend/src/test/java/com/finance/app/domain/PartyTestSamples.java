package com.finance.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class PartyTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));
    private static final AtomicInteger intCount = new AtomicInteger(random.nextInt() + (2 * Short.MAX_VALUE));

    public static Party getPartySample1() {
        return new Party()
            .id(1L)
            .name("name1")
            .mobile("mobile1")
            .email("email1")
            .addressLine1("addressLine11")
            .addressCity("addressCity1")
            .addressState("addressState1")
            .addressPincode("addressPincode1")
            .gstNumber("gstNumber1")
            .panNumber("panNumber1")
            .paymentTermsDays(1);
    }

    public static Party getPartySample2() {
        return new Party()
            .id(2L)
            .name("name2")
            .mobile("mobile2")
            .email("email2")
            .addressLine1("addressLine12")
            .addressCity("addressCity2")
            .addressState("addressState2")
            .addressPincode("addressPincode2")
            .gstNumber("gstNumber2")
            .panNumber("panNumber2")
            .paymentTermsDays(2);
    }

    public static Party getPartyRandomSampleGenerator() {
        return new Party()
            .id(longCount.incrementAndGet())
            .name(UUID.randomUUID().toString())
            .mobile(UUID.randomUUID().toString())
            .email(UUID.randomUUID().toString())
            .addressLine1(UUID.randomUUID().toString())
            .addressCity(UUID.randomUUID().toString())
            .addressState(UUID.randomUUID().toString())
            .addressPincode(UUID.randomUUID().toString())
            .gstNumber(UUID.randomUUID().toString())
            .panNumber(UUID.randomUUID().toString())
            .paymentTermsDays(intCount.incrementAndGet());
    }
}
