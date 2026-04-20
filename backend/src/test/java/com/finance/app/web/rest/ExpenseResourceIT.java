package com.finance.app.web.rest;

import static com.finance.app.domain.ExpenseAsserts.*;
import static com.finance.app.web.rest.TestUtil.createUpdateProxyForBean;
import static com.finance.app.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.app.IntegrationTest;
import com.finance.app.domain.Account;
import com.finance.app.domain.Business;
import com.finance.app.domain.Expense;
import com.finance.app.domain.Party;
import com.finance.app.domain.enumeration.PaymentMode;
import com.finance.app.repository.ExpenseRepository;
import com.finance.app.service.ExpenseService;
import com.finance.app.service.dto.ExpenseDTO;
import com.finance.app.service.mapper.ExpenseMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link ExpenseResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class ExpenseResourceIT {

    private static final Instant DEFAULT_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final BigDecimal DEFAULT_AMOUNT = new BigDecimal(0);
    private static final BigDecimal UPDATED_AMOUNT = new BigDecimal(1);
    private static final BigDecimal SMALLER_AMOUNT = new BigDecimal(0 - 1);

    private static final String DEFAULT_CATEGORY = "AAAAAAAAAA";
    private static final String UPDATED_CATEGORY = "BBBBBBBBBB";

    private static final PaymentMode DEFAULT_MODE = PaymentMode.CASH;
    private static final PaymentMode UPDATED_MODE = PaymentMode.BANK;

    private static final String DEFAULT_REFERENCE = "AAAAAAAAAA";
    private static final String UPDATED_REFERENCE = "BBBBBBBBBB";

    private static final String DEFAULT_NOTES = "AAAAAAAAAA";
    private static final String UPDATED_NOTES = "BBBBBBBBBB";

    private static final Boolean DEFAULT_DELETED = false;
    private static final Boolean UPDATED_DELETED = true;

    private static final Instant DEFAULT_CREATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_UPDATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_UPDATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/expenses";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseRepository expenseRepositoryMock;

    @Autowired
    private ExpenseMapper expenseMapper;

    @Mock
    private ExpenseService expenseServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restExpenseMockMvc;

    private Expense expense;

    private Expense insertedExpense;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Expense createEntity() {
        return new Expense()
            .date(DEFAULT_DATE)
            .amount(DEFAULT_AMOUNT)
            .category(DEFAULT_CATEGORY)
            .mode(DEFAULT_MODE)
            .reference(DEFAULT_REFERENCE)
            .notes(DEFAULT_NOTES)
            .deleted(DEFAULT_DELETED)
            .createdAt(DEFAULT_CREATED_AT)
            .updatedAt(DEFAULT_UPDATED_AT);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Expense createUpdatedEntity() {
        return new Expense()
            .date(UPDATED_DATE)
            .amount(UPDATED_AMOUNT)
            .category(UPDATED_CATEGORY)
            .mode(UPDATED_MODE)
            .reference(UPDATED_REFERENCE)
            .notes(UPDATED_NOTES)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
    }

    @BeforeEach
    void initTest() {
        expense = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedExpense != null) {
            expenseRepository.delete(insertedExpense);
            insertedExpense = null;
        }
    }

    @Test
    @Transactional
    void createExpense() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Expense
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);
        var returnedExpenseDTO = om.readValue(
            restExpenseMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            ExpenseDTO.class
        );

        // Validate the Expense in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedExpense = expenseMapper.toEntity(returnedExpenseDTO);
        assertExpenseUpdatableFieldsEquals(returnedExpense, getPersistedExpense(returnedExpense));

        insertedExpense = returnedExpense;
    }

    @Test
    @Transactional
    void createExpenseWithExistingId() throws Exception {
        // Create the Expense with an existing ID
        expense.setId(1L);
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restExpenseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Expense in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkDateIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        expense.setDate(null);

        // Create the Expense, which fails.
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);

        restExpenseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkAmountIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        expense.setAmount(null);

        // Create the Expense, which fails.
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);

        restExpenseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCategoryIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        expense.setCategory(null);

        // Create the Expense, which fails.
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);

        restExpenseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        expense.setCreatedAt(null);

        // Create the Expense, which fails.
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);

        restExpenseMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllExpenses() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList
        restExpenseMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(expense.getId().intValue())))
            .andExpect(jsonPath("$.[*].date").value(hasItem(DEFAULT_DATE.toString())))
            .andExpect(jsonPath("$.[*].amount").value(hasItem(sameNumber(DEFAULT_AMOUNT))))
            .andExpect(jsonPath("$.[*].category").value(hasItem(DEFAULT_CATEGORY)))
            .andExpect(jsonPath("$.[*].mode").value(hasItem(DEFAULT_MODE.toString())))
            .andExpect(jsonPath("$.[*].reference").value(hasItem(DEFAULT_REFERENCE)))
            .andExpect(jsonPath("$.[*].notes").value(hasItem(DEFAULT_NOTES)))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllExpensesWithEagerRelationshipsIsEnabled() throws Exception {
        when(expenseServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restExpenseMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(expenseServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllExpensesWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(expenseServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restExpenseMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(expenseRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getExpense() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get the expense
        restExpenseMockMvc
            .perform(get(ENTITY_API_URL_ID, expense.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(expense.getId().intValue()))
            .andExpect(jsonPath("$.date").value(DEFAULT_DATE.toString()))
            .andExpect(jsonPath("$.amount").value(sameNumber(DEFAULT_AMOUNT)))
            .andExpect(jsonPath("$.category").value(DEFAULT_CATEGORY))
            .andExpect(jsonPath("$.mode").value(DEFAULT_MODE.toString()))
            .andExpect(jsonPath("$.reference").value(DEFAULT_REFERENCE))
            .andExpect(jsonPath("$.notes").value(DEFAULT_NOTES))
            .andExpect(jsonPath("$.deleted").value(DEFAULT_DELETED))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()))
            .andExpect(jsonPath("$.updatedAt").value(DEFAULT_UPDATED_AT.toString()));
    }

    @Test
    @Transactional
    void getExpensesByIdFiltering() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        Long id = expense.getId();

        defaultExpenseFiltering("id.equals=" + id, "id.notEquals=" + id);

        defaultExpenseFiltering("id.greaterThanOrEqual=" + id, "id.greaterThan=" + id);

        defaultExpenseFiltering("id.lessThanOrEqual=" + id, "id.lessThan=" + id);
    }

    @Test
    @Transactional
    void getAllExpensesByDateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where date equals to
        defaultExpenseFiltering("date.equals=" + DEFAULT_DATE, "date.equals=" + UPDATED_DATE);
    }

    @Test
    @Transactional
    void getAllExpensesByDateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where date in
        defaultExpenseFiltering("date.in=" + DEFAULT_DATE + "," + UPDATED_DATE, "date.in=" + UPDATED_DATE);
    }

    @Test
    @Transactional
    void getAllExpensesByDateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where date is not null
        defaultExpenseFiltering("date.specified=true", "date.specified=false");
    }

    @Test
    @Transactional
    void getAllExpensesByAmountIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where amount equals to
        defaultExpenseFiltering("amount.equals=" + DEFAULT_AMOUNT, "amount.equals=" + UPDATED_AMOUNT);
    }

    @Test
    @Transactional
    void getAllExpensesByAmountIsInShouldWork() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where amount in
        defaultExpenseFiltering("amount.in=" + DEFAULT_AMOUNT + "," + UPDATED_AMOUNT, "amount.in=" + UPDATED_AMOUNT);
    }

    @Test
    @Transactional
    void getAllExpensesByAmountIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where amount is not null
        defaultExpenseFiltering("amount.specified=true", "amount.specified=false");
    }

    @Test
    @Transactional
    void getAllExpensesByAmountIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where amount is greater than or equal to
        defaultExpenseFiltering("amount.greaterThanOrEqual=" + DEFAULT_AMOUNT, "amount.greaterThanOrEqual=" + UPDATED_AMOUNT);
    }

    @Test
    @Transactional
    void getAllExpensesByAmountIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where amount is less than or equal to
        defaultExpenseFiltering("amount.lessThanOrEqual=" + DEFAULT_AMOUNT, "amount.lessThanOrEqual=" + SMALLER_AMOUNT);
    }

    @Test
    @Transactional
    void getAllExpensesByAmountIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where amount is less than
        defaultExpenseFiltering("amount.lessThan=" + UPDATED_AMOUNT, "amount.lessThan=" + DEFAULT_AMOUNT);
    }

    @Test
    @Transactional
    void getAllExpensesByAmountIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where amount is greater than
        defaultExpenseFiltering("amount.greaterThan=" + SMALLER_AMOUNT, "amount.greaterThan=" + DEFAULT_AMOUNT);
    }

    @Test
    @Transactional
    void getAllExpensesByCategoryIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where category equals to
        defaultExpenseFiltering("category.equals=" + DEFAULT_CATEGORY, "category.equals=" + UPDATED_CATEGORY);
    }

    @Test
    @Transactional
    void getAllExpensesByCategoryIsInShouldWork() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where category in
        defaultExpenseFiltering("category.in=" + DEFAULT_CATEGORY + "," + UPDATED_CATEGORY, "category.in=" + UPDATED_CATEGORY);
    }

    @Test
    @Transactional
    void getAllExpensesByCategoryIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where category is not null
        defaultExpenseFiltering("category.specified=true", "category.specified=false");
    }

    @Test
    @Transactional
    void getAllExpensesByCategoryContainsSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where category contains
        defaultExpenseFiltering("category.contains=" + DEFAULT_CATEGORY, "category.contains=" + UPDATED_CATEGORY);
    }

    @Test
    @Transactional
    void getAllExpensesByCategoryNotContainsSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where category does not contain
        defaultExpenseFiltering("category.doesNotContain=" + UPDATED_CATEGORY, "category.doesNotContain=" + DEFAULT_CATEGORY);
    }

    @Test
    @Transactional
    void getAllExpensesByModeIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where mode equals to
        defaultExpenseFiltering("mode.equals=" + DEFAULT_MODE, "mode.equals=" + UPDATED_MODE);
    }

    @Test
    @Transactional
    void getAllExpensesByModeIsInShouldWork() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where mode in
        defaultExpenseFiltering("mode.in=" + DEFAULT_MODE + "," + UPDATED_MODE, "mode.in=" + UPDATED_MODE);
    }

    @Test
    @Transactional
    void getAllExpensesByModeIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where mode is not null
        defaultExpenseFiltering("mode.specified=true", "mode.specified=false");
    }

    @Test
    @Transactional
    void getAllExpensesByReferenceIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where reference equals to
        defaultExpenseFiltering("reference.equals=" + DEFAULT_REFERENCE, "reference.equals=" + UPDATED_REFERENCE);
    }

    @Test
    @Transactional
    void getAllExpensesByReferenceIsInShouldWork() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where reference in
        defaultExpenseFiltering("reference.in=" + DEFAULT_REFERENCE + "," + UPDATED_REFERENCE, "reference.in=" + UPDATED_REFERENCE);
    }

    @Test
    @Transactional
    void getAllExpensesByReferenceIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where reference is not null
        defaultExpenseFiltering("reference.specified=true", "reference.specified=false");
    }

    @Test
    @Transactional
    void getAllExpensesByReferenceContainsSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where reference contains
        defaultExpenseFiltering("reference.contains=" + DEFAULT_REFERENCE, "reference.contains=" + UPDATED_REFERENCE);
    }

    @Test
    @Transactional
    void getAllExpensesByReferenceNotContainsSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where reference does not contain
        defaultExpenseFiltering("reference.doesNotContain=" + UPDATED_REFERENCE, "reference.doesNotContain=" + DEFAULT_REFERENCE);
    }

    @Test
    @Transactional
    void getAllExpensesByNotesIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where notes equals to
        defaultExpenseFiltering("notes.equals=" + DEFAULT_NOTES, "notes.equals=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllExpensesByNotesIsInShouldWork() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where notes in
        defaultExpenseFiltering("notes.in=" + DEFAULT_NOTES + "," + UPDATED_NOTES, "notes.in=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllExpensesByNotesIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where notes is not null
        defaultExpenseFiltering("notes.specified=true", "notes.specified=false");
    }

    @Test
    @Transactional
    void getAllExpensesByNotesContainsSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where notes contains
        defaultExpenseFiltering("notes.contains=" + DEFAULT_NOTES, "notes.contains=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllExpensesByNotesNotContainsSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where notes does not contain
        defaultExpenseFiltering("notes.doesNotContain=" + UPDATED_NOTES, "notes.doesNotContain=" + DEFAULT_NOTES);
    }

    @Test
    @Transactional
    void getAllExpensesByDeletedIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where deleted equals to
        defaultExpenseFiltering("deleted.equals=" + DEFAULT_DELETED, "deleted.equals=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllExpensesByDeletedIsInShouldWork() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where deleted in
        defaultExpenseFiltering("deleted.in=" + DEFAULT_DELETED + "," + UPDATED_DELETED, "deleted.in=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllExpensesByDeletedIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where deleted is not null
        defaultExpenseFiltering("deleted.specified=true", "deleted.specified=false");
    }

    @Test
    @Transactional
    void getAllExpensesByCreatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where createdAt equals to
        defaultExpenseFiltering("createdAt.equals=" + DEFAULT_CREATED_AT, "createdAt.equals=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllExpensesByCreatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where createdAt in
        defaultExpenseFiltering("createdAt.in=" + DEFAULT_CREATED_AT + "," + UPDATED_CREATED_AT, "createdAt.in=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllExpensesByCreatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where createdAt is not null
        defaultExpenseFiltering("createdAt.specified=true", "createdAt.specified=false");
    }

    @Test
    @Transactional
    void getAllExpensesByUpdatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where updatedAt equals to
        defaultExpenseFiltering("updatedAt.equals=" + DEFAULT_UPDATED_AT, "updatedAt.equals=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllExpensesByUpdatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where updatedAt in
        defaultExpenseFiltering("updatedAt.in=" + DEFAULT_UPDATED_AT + "," + UPDATED_UPDATED_AT, "updatedAt.in=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllExpensesByUpdatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        // Get all the expenseList where updatedAt is not null
        defaultExpenseFiltering("updatedAt.specified=true", "updatedAt.specified=false");
    }

    @Test
    @Transactional
    void getAllExpensesByBusinessIsEqualToSomething() throws Exception {
        Business business;
        if (TestUtil.findAll(em, Business.class).isEmpty()) {
            expenseRepository.saveAndFlush(expense);
            business = BusinessResourceIT.createEntity();
        } else {
            business = TestUtil.findAll(em, Business.class).get(0);
        }
        em.persist(business);
        em.flush();
        expense.setBusiness(business);
        expenseRepository.saveAndFlush(expense);
        Long businessId = business.getId();
        // Get all the expenseList where business equals to businessId
        defaultExpenseShouldBeFound("businessId.equals=" + businessId);

        // Get all the expenseList where business equals to (businessId + 1)
        defaultExpenseShouldNotBeFound("businessId.equals=" + (businessId + 1));
    }

    @Test
    @Transactional
    void getAllExpensesByPartyIsEqualToSomething() throws Exception {
        Party party;
        if (TestUtil.findAll(em, Party.class).isEmpty()) {
            expenseRepository.saveAndFlush(expense);
            party = PartyResourceIT.createEntity();
        } else {
            party = TestUtil.findAll(em, Party.class).get(0);
        }
        em.persist(party);
        em.flush();
        expense.setParty(party);
        expenseRepository.saveAndFlush(expense);
        Long partyId = party.getId();
        // Get all the expenseList where party equals to partyId
        defaultExpenseShouldBeFound("partyId.equals=" + partyId);

        // Get all the expenseList where party equals to (partyId + 1)
        defaultExpenseShouldNotBeFound("partyId.equals=" + (partyId + 1));
    }

    @Test
    @Transactional
    void getAllExpensesByAccountIsEqualToSomething() throws Exception {
        Account account;
        if (TestUtil.findAll(em, Account.class).isEmpty()) {
            expenseRepository.saveAndFlush(expense);
            account = AccountResourceIT.createEntity();
        } else {
            account = TestUtil.findAll(em, Account.class).get(0);
        }
        em.persist(account);
        em.flush();
        expense.setAccount(account);
        expenseRepository.saveAndFlush(expense);
        Long accountId = account.getId();
        // Get all the expenseList where account equals to accountId
        defaultExpenseShouldBeFound("accountId.equals=" + accountId);

        // Get all the expenseList where account equals to (accountId + 1)
        defaultExpenseShouldNotBeFound("accountId.equals=" + (accountId + 1));
    }

    private void defaultExpenseFiltering(String shouldBeFound, String shouldNotBeFound) throws Exception {
        defaultExpenseShouldBeFound(shouldBeFound);
        defaultExpenseShouldNotBeFound(shouldNotBeFound);
    }

    /**
     * Executes the search, and checks that the default entity is returned.
     */
    private void defaultExpenseShouldBeFound(String filter) throws Exception {
        restExpenseMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(expense.getId().intValue())))
            .andExpect(jsonPath("$.[*].date").value(hasItem(DEFAULT_DATE.toString())))
            .andExpect(jsonPath("$.[*].amount").value(hasItem(sameNumber(DEFAULT_AMOUNT))))
            .andExpect(jsonPath("$.[*].category").value(hasItem(DEFAULT_CATEGORY)))
            .andExpect(jsonPath("$.[*].mode").value(hasItem(DEFAULT_MODE.toString())))
            .andExpect(jsonPath("$.[*].reference").value(hasItem(DEFAULT_REFERENCE)))
            .andExpect(jsonPath("$.[*].notes").value(hasItem(DEFAULT_NOTES)))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));

        // Check, that the count call also returns 1
        restExpenseMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("1"));
    }

    /**
     * Executes the search, and checks that the default entity is not returned.
     */
    private void defaultExpenseShouldNotBeFound(String filter) throws Exception {
        restExpenseMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());

        // Check, that the count call also returns 0
        restExpenseMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("0"));
    }

    @Test
    @Transactional
    void getNonExistingExpense() throws Exception {
        // Get the expense
        restExpenseMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingExpense() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the expense
        Expense updatedExpense = expenseRepository.findById(expense.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedExpense are not directly saved in db
        em.detach(updatedExpense);
        updatedExpense
            .date(UPDATED_DATE)
            .amount(UPDATED_AMOUNT)
            .category(UPDATED_CATEGORY)
            .mode(UPDATED_MODE)
            .reference(UPDATED_REFERENCE)
            .notes(UPDATED_NOTES)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
        ExpenseDTO expenseDTO = expenseMapper.toDto(updatedExpense);

        restExpenseMockMvc
            .perform(
                put(ENTITY_API_URL_ID, expenseDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseDTO))
            )
            .andExpect(status().isOk());

        // Validate the Expense in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedExpenseToMatchAllProperties(updatedExpense);
    }

    @Test
    @Transactional
    void putNonExistingExpense() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expense.setId(longCount.incrementAndGet());

        // Create the Expense
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restExpenseMockMvc
            .perform(
                put(ENTITY_API_URL_ID, expenseDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Expense in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchExpense() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expense.setId(longCount.incrementAndGet());

        // Create the Expense
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExpenseMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(expenseDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Expense in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamExpense() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expense.setId(longCount.incrementAndGet());

        // Create the Expense
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExpenseMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Expense in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateExpenseWithPatch() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the expense using partial update
        Expense partialUpdatedExpense = new Expense();
        partialUpdatedExpense.setId(expense.getId());

        partialUpdatedExpense.date(UPDATED_DATE).deleted(UPDATED_DELETED).createdAt(UPDATED_CREATED_AT);

        restExpenseMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedExpense.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedExpense))
            )
            .andExpect(status().isOk());

        // Validate the Expense in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertExpenseUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedExpense, expense), getPersistedExpense(expense));
    }

    @Test
    @Transactional
    void fullUpdateExpenseWithPatch() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the expense using partial update
        Expense partialUpdatedExpense = new Expense();
        partialUpdatedExpense.setId(expense.getId());

        partialUpdatedExpense
            .date(UPDATED_DATE)
            .amount(UPDATED_AMOUNT)
            .category(UPDATED_CATEGORY)
            .mode(UPDATED_MODE)
            .reference(UPDATED_REFERENCE)
            .notes(UPDATED_NOTES)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);

        restExpenseMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedExpense.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedExpense))
            )
            .andExpect(status().isOk());

        // Validate the Expense in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertExpenseUpdatableFieldsEquals(partialUpdatedExpense, getPersistedExpense(partialUpdatedExpense));
    }

    @Test
    @Transactional
    void patchNonExistingExpense() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expense.setId(longCount.incrementAndGet());

        // Create the Expense
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restExpenseMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, expenseDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(expenseDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Expense in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchExpense() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expense.setId(longCount.incrementAndGet());

        // Create the Expense
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExpenseMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(expenseDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Expense in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamExpense() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expense.setId(longCount.incrementAndGet());

        // Create the Expense
        ExpenseDTO expenseDTO = expenseMapper.toDto(expense);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExpenseMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(expenseDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Expense in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteExpense() throws Exception {
        // Initialize the database
        insertedExpense = expenseRepository.saveAndFlush(expense);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the expense
        restExpenseMockMvc
            .perform(delete(ENTITY_API_URL_ID, expense.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return expenseRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected Expense getPersistedExpense(Expense expense) {
        return expenseRepository.findById(expense.getId()).orElseThrow();
    }

    protected void assertPersistedExpenseToMatchAllProperties(Expense expectedExpense) {
        assertExpenseAllPropertiesEquals(expectedExpense, getPersistedExpense(expectedExpense));
    }

    protected void assertPersistedExpenseToMatchUpdatableProperties(Expense expectedExpense) {
        assertExpenseAllUpdatablePropertiesEquals(expectedExpense, getPersistedExpense(expectedExpense));
    }
}
