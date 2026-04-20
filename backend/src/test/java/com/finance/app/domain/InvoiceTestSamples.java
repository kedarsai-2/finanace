package com.finance.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class InvoiceTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));
    private static final AtomicInteger intCount = new AtomicInteger(random.nextInt() + (2 * Short.MAX_VALUE));

    public static Invoice getInvoiceSample1() {
        return new Invoice()
            .id(1L)
            .number("number1")
            .paymentTermsDays(1)
            .partyName("partyName1")
            .partyState("partyState1")
            .businessState("businessState1")
            .notes("notes1")
            .terms("terms1");
    }

    public static Invoice getInvoiceSample2() {
        return new Invoice()
            .id(2L)
            .number("number2")
            .paymentTermsDays(2)
            .partyName("partyName2")
            .partyState("partyState2")
            .businessState("businessState2")
            .notes("notes2")
            .terms("terms2");
    }

    public static Invoice getInvoiceRandomSampleGenerator() {
        return new Invoice()
            .id(longCount.incrementAndGet())
            .number(UUID.randomUUID().toString())
            .paymentTermsDays(intCount.incrementAndGet())
            .partyName(UUID.randomUUID().toString())
            .partyState(UUID.randomUUID().toString())
            .businessState(UUID.randomUUID().toString())
            .notes(UUID.randomUUID().toString())
            .terms(UUID.randomUUID().toString());
    }
}
