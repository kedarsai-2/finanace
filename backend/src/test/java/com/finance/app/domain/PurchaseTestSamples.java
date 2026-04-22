package com.finance.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class PurchaseTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    public static Purchase getPurchaseSample1() {
        return new Purchase()
            .id(1L)
            .number("number1")
            .partyName("partyName1")
            .partyState("partyState1")
            .businessState("businessState1")
            .sourcePurchaseId(1L)
            .notes("notes1")
            .terms("terms1");
    }

    public static Purchase getPurchaseSample2() {
        return new Purchase()
            .id(2L)
            .number("number2")
            .partyName("partyName2")
            .partyState("partyState2")
            .businessState("businessState2")
            .sourcePurchaseId(2L)
            .notes("notes2")
            .terms("terms2");
    }

    public static Purchase getPurchaseRandomSampleGenerator() {
        return new Purchase()
            .id(longCount.incrementAndGet())
            .number(UUID.randomUUID().toString())
            .partyName(UUID.randomUUID().toString())
            .partyState(UUID.randomUUID().toString())
            .businessState(UUID.randomUUID().toString())
            .sourcePurchaseId(longCount.incrementAndGet())
            .notes(UUID.randomUUID().toString())
            .terms(UUID.randomUUID().toString());
    }
}
