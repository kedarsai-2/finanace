package com.finance.app.domain;

import static com.finance.app.domain.AccountTestSamples.*;
import static com.finance.app.domain.BusinessTestSamples.*;
import static com.finance.app.domain.ExpenseTestSamples.*;
import static com.finance.app.domain.PartyTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ExpenseTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Expense.class);
        Expense expense1 = getExpenseSample1();
        Expense expense2 = new Expense();
        assertThat(expense1).isNotEqualTo(expense2);

        expense2.setId(expense1.getId());
        assertThat(expense1).isEqualTo(expense2);

        expense2 = getExpenseSample2();
        assertThat(expense1).isNotEqualTo(expense2);
    }

    @Test
    void businessTest() {
        Expense expense = getExpenseRandomSampleGenerator();
        Business businessBack = getBusinessRandomSampleGenerator();

        expense.setBusiness(businessBack);
        assertThat(expense.getBusiness()).isEqualTo(businessBack);

        expense.business(null);
        assertThat(expense.getBusiness()).isNull();
    }

    @Test
    void partyTest() {
        Expense expense = getExpenseRandomSampleGenerator();
        Party partyBack = getPartyRandomSampleGenerator();

        expense.setParty(partyBack);
        assertThat(expense.getParty()).isEqualTo(partyBack);

        expense.party(null);
        assertThat(expense.getParty()).isNull();
    }

    @Test
    void accountTest() {
        Expense expense = getExpenseRandomSampleGenerator();
        Account accountBack = getAccountRandomSampleGenerator();

        expense.setAccount(accountBack);
        assertThat(expense.getAccount()).isEqualTo(accountBack);

        expense.account(null);
        assertThat(expense.getAccount()).isNull();
    }
}
