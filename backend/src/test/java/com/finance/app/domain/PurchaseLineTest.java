package com.finance.app.domain;

import static com.finance.app.domain.ItemTestSamples.*;
import static com.finance.app.domain.PurchaseLineTestSamples.*;
import static com.finance.app.domain.PurchaseTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class PurchaseLineTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(PurchaseLine.class);
        PurchaseLine purchaseLine1 = getPurchaseLineSample1();
        PurchaseLine purchaseLine2 = new PurchaseLine();
        assertThat(purchaseLine1).isNotEqualTo(purchaseLine2);

        purchaseLine2.setId(purchaseLine1.getId());
        assertThat(purchaseLine1).isEqualTo(purchaseLine2);

        purchaseLine2 = getPurchaseLineSample2();
        assertThat(purchaseLine1).isNotEqualTo(purchaseLine2);
    }

    @Test
    void itemTest() {
        PurchaseLine purchaseLine = getPurchaseLineRandomSampleGenerator();
        Item itemBack = getItemRandomSampleGenerator();

        purchaseLine.setItem(itemBack);
        assertThat(purchaseLine.getItem()).isEqualTo(itemBack);

        purchaseLine.item(null);
        assertThat(purchaseLine.getItem()).isNull();
    }

    @Test
    void purchaseTest() {
        PurchaseLine purchaseLine = getPurchaseLineRandomSampleGenerator();
        Purchase purchaseBack = getPurchaseRandomSampleGenerator();

        purchaseLine.setPurchase(purchaseBack);
        assertThat(purchaseLine.getPurchase()).isEqualTo(purchaseBack);

        purchaseLine.purchase(null);
        assertThat(purchaseLine.getPurchase()).isNull();
    }
}
