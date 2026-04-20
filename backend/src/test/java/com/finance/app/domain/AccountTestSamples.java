package com.finance.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class AccountTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    public static Account getAccountSample1() {
        return new Account().id(1L).name("name1").accountNumber("accountNumber1").ifsc("ifsc1").upiId("upiId1").notes("notes1");
    }

    public static Account getAccountSample2() {
        return new Account().id(2L).name("name2").accountNumber("accountNumber2").ifsc("ifsc2").upiId("upiId2").notes("notes2");
    }

    public static Account getAccountRandomSampleGenerator() {
        return new Account()
            .id(longCount.incrementAndGet())
            .name(UUID.randomUUID().toString())
            .accountNumber(UUID.randomUUID().toString())
            .ifsc(UUID.randomUUID().toString())
            .upiId(UUID.randomUUID().toString())
            .notes(UUID.randomUUID().toString());
    }
}
