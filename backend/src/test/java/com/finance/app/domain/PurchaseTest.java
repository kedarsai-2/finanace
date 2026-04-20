package com.finance.app.domain;

import static com.finance.app.domain.BusinessTestSamples.*;
import static com.finance.app.domain.PartyTestSamples.*;
import static com.finance.app.domain.PurchaseLineTestSamples.*;
import static com.finance.app.domain.PurchaseTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class PurchaseTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Purchase.class);
        Purchase purchase1 = getPurchaseSample1();
        Purchase purchase2 = new Purchase();
        assertThat(purchase1).isNotEqualTo(purchase2);

        purchase2.setId(purchase1.getId());
        assertThat(purchase1).isEqualTo(purchase2);

        purchase2 = getPurchaseSample2();
        assertThat(purchase1).isNotEqualTo(purchase2);
    }

    @Test
    void linesTest() {
        Purchase purchase = getPurchaseRandomSampleGenerator();
        PurchaseLine purchaseLineBack = getPurchaseLineRandomSampleGenerator();

        purchase.addLines(purchaseLineBack);
        assertThat(purchase.getLineses()).containsOnly(purchaseLineBack);
        assertThat(purchaseLineBack.getPurchase()).isEqualTo(purchase);

        purchase.removeLines(purchaseLineBack);
        assertThat(purchase.getLineses()).doesNotContain(purchaseLineBack);
        assertThat(purchaseLineBack.getPurchase()).isNull();

        purchase.lineses(new HashSet<>(Set.of(purchaseLineBack)));
        assertThat(purchase.getLineses()).containsOnly(purchaseLineBack);
        assertThat(purchaseLineBack.getPurchase()).isEqualTo(purchase);

        purchase.setLineses(new HashSet<>());
        assertThat(purchase.getLineses()).doesNotContain(purchaseLineBack);
        assertThat(purchaseLineBack.getPurchase()).isNull();
    }

    @Test
    void businessTest() {
        Purchase purchase = getPurchaseRandomSampleGenerator();
        Business businessBack = getBusinessRandomSampleGenerator();

        purchase.setBusiness(businessBack);
        assertThat(purchase.getBusiness()).isEqualTo(businessBack);

        purchase.business(null);
        assertThat(purchase.getBusiness()).isNull();
    }

    @Test
    void partyTest() {
        Purchase purchase = getPurchaseRandomSampleGenerator();
        Party partyBack = getPartyRandomSampleGenerator();

        purchase.setParty(partyBack);
        assertThat(purchase.getParty()).isEqualTo(partyBack);

        purchase.party(null);
        assertThat(purchase.getParty()).isNull();
    }
}
