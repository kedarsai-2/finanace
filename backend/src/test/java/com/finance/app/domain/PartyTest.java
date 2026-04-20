package com.finance.app.domain;

import static com.finance.app.domain.BusinessTestSamples.*;
import static com.finance.app.domain.PartyTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class PartyTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Party.class);
        Party party1 = getPartySample1();
        Party party2 = new Party();
        assertThat(party1).isNotEqualTo(party2);

        party2.setId(party1.getId());
        assertThat(party1).isEqualTo(party2);

        party2 = getPartySample2();
        assertThat(party1).isNotEqualTo(party2);
    }

    @Test
    void businessTest() {
        Party party = getPartyRandomSampleGenerator();
        Business businessBack = getBusinessRandomSampleGenerator();

        party.setBusiness(businessBack);
        assertThat(party.getBusiness()).isEqualTo(businessBack);

        party.business(null);
        assertThat(party.getBusiness()).isNull();
    }
}
