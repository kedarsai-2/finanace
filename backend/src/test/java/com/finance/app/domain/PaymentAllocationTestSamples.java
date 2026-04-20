package com.finance.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class PaymentAllocationTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    public static PaymentAllocation getPaymentAllocationSample1() {
        return new PaymentAllocation().id(1L).docId("docId1").docNumber("docNumber1");
    }

    public static PaymentAllocation getPaymentAllocationSample2() {
        return new PaymentAllocation().id(2L).docId("docId2").docNumber("docNumber2");
    }

    public static PaymentAllocation getPaymentAllocationRandomSampleGenerator() {
        return new PaymentAllocation()
            .id(longCount.incrementAndGet())
            .docId(UUID.randomUUID().toString())
            .docNumber(UUID.randomUUID().toString());
    }
}
