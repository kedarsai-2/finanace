package com.finance.app.web.rest;

import static com.finance.app.domain.AccountAsserts.*;
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
import com.finance.app.domain.enumeration.AccountType;
import com.finance.app.repository.AccountRepository;
import com.finance.app.service.AccountService;
import com.finance.app.service.dto.AccountDTO;
import com.finance.app.service.mapper.AccountMapper;
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
 * Integration tests for the {@link AccountResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class AccountResourceIT {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final AccountType DEFAULT_TYPE = AccountType.CASH;
    private static final AccountType UPDATED_TYPE = AccountType.BANK;

    private static final BigDecimal DEFAULT_OPENING_BALANCE = new BigDecimal(1);
    private static final BigDecimal UPDATED_OPENING_BALANCE = new BigDecimal(2);
    private static final BigDecimal SMALLER_OPENING_BALANCE = new BigDecimal(1 - 1);

    private static final String DEFAULT_ACCOUNT_NUMBER = "AAAAAAAAAA";
    private static final String UPDATED_ACCOUNT_NUMBER = "BBBBBBBBBB";

    private static final String DEFAULT_IFSC = "AAAAAAAAAA";
    private static final String UPDATED_IFSC = "BBBBBBBBBB";

    private static final String DEFAULT_UPI_ID = "AAAAAAAAAA";
    private static final String UPDATED_UPI_ID = "BBBBBBBBBB";

    private static final String DEFAULT_NOTES = "AAAAAAAAAA";
    private static final String UPDATED_NOTES = "BBBBBBBBBB";

    private static final Boolean DEFAULT_DELETED = false;
    private static final Boolean UPDATED_DELETED = true;

    private static final Instant DEFAULT_CREATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_UPDATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_UPDATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/accounts";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private AccountRepository accountRepository;

    @Mock
    private AccountRepository accountRepositoryMock;

    @Autowired
    private AccountMapper accountMapper;

    @Mock
    private AccountService accountServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restAccountMockMvc;

    private Account account;

    private Account insertedAccount;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Account createEntity() {
        return new Account()
            .name(DEFAULT_NAME)
            .type(DEFAULT_TYPE)
            .openingBalance(DEFAULT_OPENING_BALANCE)
            .accountNumber(DEFAULT_ACCOUNT_NUMBER)
            .ifsc(DEFAULT_IFSC)
            .upiId(DEFAULT_UPI_ID)
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
    public static Account createUpdatedEntity() {
        return new Account()
            .name(UPDATED_NAME)
            .type(UPDATED_TYPE)
            .openingBalance(UPDATED_OPENING_BALANCE)
            .accountNumber(UPDATED_ACCOUNT_NUMBER)
            .ifsc(UPDATED_IFSC)
            .upiId(UPDATED_UPI_ID)
            .notes(UPDATED_NOTES)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
    }

    @BeforeEach
    void initTest() {
        account = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedAccount != null) {
            accountRepository.delete(insertedAccount);
            insertedAccount = null;
        }
    }

    @Test
    @Transactional
    void createAccount() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Account
        AccountDTO accountDTO = accountMapper.toDto(account);
        var returnedAccountDTO = om.readValue(
            restAccountMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(accountDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            AccountDTO.class
        );

        // Validate the Account in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedAccount = accountMapper.toEntity(returnedAccountDTO);
        assertAccountUpdatableFieldsEquals(returnedAccount, getPersistedAccount(returnedAccount));

        insertedAccount = returnedAccount;
    }

    @Test
    @Transactional
    void createAccountWithExistingId() throws Exception {
        // Create the Account with an existing ID
        account.setId(1L);
        AccountDTO accountDTO = accountMapper.toDto(account);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restAccountMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(accountDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Account in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        account.setName(null);

        // Create the Account, which fails.
        AccountDTO accountDTO = accountMapper.toDto(account);

        restAccountMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(accountDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTypeIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        account.setType(null);

        // Create the Account, which fails.
        AccountDTO accountDTO = accountMapper.toDto(account);

        restAccountMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(accountDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkOpeningBalanceIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        account.setOpeningBalance(null);

        // Create the Account, which fails.
        AccountDTO accountDTO = accountMapper.toDto(account);

        restAccountMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(accountDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        account.setCreatedAt(null);

        // Create the Account, which fails.
        AccountDTO accountDTO = accountMapper.toDto(account);

        restAccountMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(accountDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllAccounts() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList
        restAccountMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(account.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)))
            .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE.toString())))
            .andExpect(jsonPath("$.[*].openingBalance").value(hasItem(sameNumber(DEFAULT_OPENING_BALANCE))))
            .andExpect(jsonPath("$.[*].accountNumber").value(hasItem(DEFAULT_ACCOUNT_NUMBER)))
            .andExpect(jsonPath("$.[*].ifsc").value(hasItem(DEFAULT_IFSC)))
            .andExpect(jsonPath("$.[*].upiId").value(hasItem(DEFAULT_UPI_ID)))
            .andExpect(jsonPath("$.[*].notes").value(hasItem(DEFAULT_NOTES)))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllAccountsWithEagerRelationshipsIsEnabled() throws Exception {
        when(accountServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restAccountMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(accountServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllAccountsWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(accountServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restAccountMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(accountRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getAccount() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get the account
        restAccountMockMvc
            .perform(get(ENTITY_API_URL_ID, account.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(account.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
            .andExpect(jsonPath("$.type").value(DEFAULT_TYPE.toString()))
            .andExpect(jsonPath("$.openingBalance").value(sameNumber(DEFAULT_OPENING_BALANCE)))
            .andExpect(jsonPath("$.accountNumber").value(DEFAULT_ACCOUNT_NUMBER))
            .andExpect(jsonPath("$.ifsc").value(DEFAULT_IFSC))
            .andExpect(jsonPath("$.upiId").value(DEFAULT_UPI_ID))
            .andExpect(jsonPath("$.notes").value(DEFAULT_NOTES))
            .andExpect(jsonPath("$.deleted").value(DEFAULT_DELETED))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()))
            .andExpect(jsonPath("$.updatedAt").value(DEFAULT_UPDATED_AT.toString()));
    }

    @Test
    @Transactional
    void getAccountsByIdFiltering() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        Long id = account.getId();

        defaultAccountFiltering("id.equals=" + id, "id.notEquals=" + id);

        defaultAccountFiltering("id.greaterThanOrEqual=" + id, "id.greaterThan=" + id);

        defaultAccountFiltering("id.lessThanOrEqual=" + id, "id.lessThan=" + id);
    }

    @Test
    @Transactional
    void getAllAccountsByNameIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where name equals to
        defaultAccountFiltering("name.equals=" + DEFAULT_NAME, "name.equals=" + UPDATED_NAME);
    }

    @Test
    @Transactional
    void getAllAccountsByNameIsInShouldWork() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where name in
        defaultAccountFiltering("name.in=" + DEFAULT_NAME + "," + UPDATED_NAME, "name.in=" + UPDATED_NAME);
    }

    @Test
    @Transactional
    void getAllAccountsByNameIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where name is not null
        defaultAccountFiltering("name.specified=true", "name.specified=false");
    }

    @Test
    @Transactional
    void getAllAccountsByNameContainsSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where name contains
        defaultAccountFiltering("name.contains=" + DEFAULT_NAME, "name.contains=" + UPDATED_NAME);
    }

    @Test
    @Transactional
    void getAllAccountsByNameNotContainsSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where name does not contain
        defaultAccountFiltering("name.doesNotContain=" + UPDATED_NAME, "name.doesNotContain=" + DEFAULT_NAME);
    }

    @Test
    @Transactional
    void getAllAccountsByTypeIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where type equals to
        defaultAccountFiltering("type.equals=" + DEFAULT_TYPE, "type.equals=" + UPDATED_TYPE);
    }

    @Test
    @Transactional
    void getAllAccountsByTypeIsInShouldWork() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where type in
        defaultAccountFiltering("type.in=" + DEFAULT_TYPE + "," + UPDATED_TYPE, "type.in=" + UPDATED_TYPE);
    }

    @Test
    @Transactional
    void getAllAccountsByTypeIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where type is not null
        defaultAccountFiltering("type.specified=true", "type.specified=false");
    }

    @Test
    @Transactional
    void getAllAccountsByOpeningBalanceIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where openingBalance equals to
        defaultAccountFiltering("openingBalance.equals=" + DEFAULT_OPENING_BALANCE, "openingBalance.equals=" + UPDATED_OPENING_BALANCE);
    }

    @Test
    @Transactional
    void getAllAccountsByOpeningBalanceIsInShouldWork() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where openingBalance in
        defaultAccountFiltering(
            "openingBalance.in=" + DEFAULT_OPENING_BALANCE + "," + UPDATED_OPENING_BALANCE,
            "openingBalance.in=" + UPDATED_OPENING_BALANCE
        );
    }

    @Test
    @Transactional
    void getAllAccountsByOpeningBalanceIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where openingBalance is not null
        defaultAccountFiltering("openingBalance.specified=true", "openingBalance.specified=false");
    }

    @Test
    @Transactional
    void getAllAccountsByOpeningBalanceIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where openingBalance is greater than or equal to
        defaultAccountFiltering(
            "openingBalance.greaterThanOrEqual=" + DEFAULT_OPENING_BALANCE,
            "openingBalance.greaterThanOrEqual=" + UPDATED_OPENING_BALANCE
        );
    }

    @Test
    @Transactional
    void getAllAccountsByOpeningBalanceIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where openingBalance is less than or equal to
        defaultAccountFiltering(
            "openingBalance.lessThanOrEqual=" + DEFAULT_OPENING_BALANCE,
            "openingBalance.lessThanOrEqual=" + SMALLER_OPENING_BALANCE
        );
    }

    @Test
    @Transactional
    void getAllAccountsByOpeningBalanceIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where openingBalance is less than
        defaultAccountFiltering("openingBalance.lessThan=" + UPDATED_OPENING_BALANCE, "openingBalance.lessThan=" + DEFAULT_OPENING_BALANCE);
    }

    @Test
    @Transactional
    void getAllAccountsByOpeningBalanceIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where openingBalance is greater than
        defaultAccountFiltering(
            "openingBalance.greaterThan=" + SMALLER_OPENING_BALANCE,
            "openingBalance.greaterThan=" + DEFAULT_OPENING_BALANCE
        );
    }

    @Test
    @Transactional
    void getAllAccountsByAccountNumberIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where accountNumber equals to
        defaultAccountFiltering("accountNumber.equals=" + DEFAULT_ACCOUNT_NUMBER, "accountNumber.equals=" + UPDATED_ACCOUNT_NUMBER);
    }

    @Test
    @Transactional
    void getAllAccountsByAccountNumberIsInShouldWork() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where accountNumber in
        defaultAccountFiltering(
            "accountNumber.in=" + DEFAULT_ACCOUNT_NUMBER + "," + UPDATED_ACCOUNT_NUMBER,
            "accountNumber.in=" + UPDATED_ACCOUNT_NUMBER
        );
    }

    @Test
    @Transactional
    void getAllAccountsByAccountNumberIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where accountNumber is not null
        defaultAccountFiltering("accountNumber.specified=true", "accountNumber.specified=false");
    }

    @Test
    @Transactional
    void getAllAccountsByAccountNumberContainsSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where accountNumber contains
        defaultAccountFiltering("accountNumber.contains=" + DEFAULT_ACCOUNT_NUMBER, "accountNumber.contains=" + UPDATED_ACCOUNT_NUMBER);
    }

    @Test
    @Transactional
    void getAllAccountsByAccountNumberNotContainsSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where accountNumber does not contain
        defaultAccountFiltering(
            "accountNumber.doesNotContain=" + UPDATED_ACCOUNT_NUMBER,
            "accountNumber.doesNotContain=" + DEFAULT_ACCOUNT_NUMBER
        );
    }

    @Test
    @Transactional
    void getAllAccountsByIfscIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where ifsc equals to
        defaultAccountFiltering("ifsc.equals=" + DEFAULT_IFSC, "ifsc.equals=" + UPDATED_IFSC);
    }

    @Test
    @Transactional
    void getAllAccountsByIfscIsInShouldWork() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where ifsc in
        defaultAccountFiltering("ifsc.in=" + DEFAULT_IFSC + "," + UPDATED_IFSC, "ifsc.in=" + UPDATED_IFSC);
    }

    @Test
    @Transactional
    void getAllAccountsByIfscIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where ifsc is not null
        defaultAccountFiltering("ifsc.specified=true", "ifsc.specified=false");
    }

    @Test
    @Transactional
    void getAllAccountsByIfscContainsSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where ifsc contains
        defaultAccountFiltering("ifsc.contains=" + DEFAULT_IFSC, "ifsc.contains=" + UPDATED_IFSC);
    }

    @Test
    @Transactional
    void getAllAccountsByIfscNotContainsSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where ifsc does not contain
        defaultAccountFiltering("ifsc.doesNotContain=" + UPDATED_IFSC, "ifsc.doesNotContain=" + DEFAULT_IFSC);
    }

    @Test
    @Transactional
    void getAllAccountsByUpiIdIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where upiId equals to
        defaultAccountFiltering("upiId.equals=" + DEFAULT_UPI_ID, "upiId.equals=" + UPDATED_UPI_ID);
    }

    @Test
    @Transactional
    void getAllAccountsByUpiIdIsInShouldWork() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where upiId in
        defaultAccountFiltering("upiId.in=" + DEFAULT_UPI_ID + "," + UPDATED_UPI_ID, "upiId.in=" + UPDATED_UPI_ID);
    }

    @Test
    @Transactional
    void getAllAccountsByUpiIdIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where upiId is not null
        defaultAccountFiltering("upiId.specified=true", "upiId.specified=false");
    }

    @Test
    @Transactional
    void getAllAccountsByUpiIdContainsSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where upiId contains
        defaultAccountFiltering("upiId.contains=" + DEFAULT_UPI_ID, "upiId.contains=" + UPDATED_UPI_ID);
    }

    @Test
    @Transactional
    void getAllAccountsByUpiIdNotContainsSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where upiId does not contain
        defaultAccountFiltering("upiId.doesNotContain=" + UPDATED_UPI_ID, "upiId.doesNotContain=" + DEFAULT_UPI_ID);
    }

    @Test
    @Transactional
    void getAllAccountsByNotesIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where notes equals to
        defaultAccountFiltering("notes.equals=" + DEFAULT_NOTES, "notes.equals=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllAccountsByNotesIsInShouldWork() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where notes in
        defaultAccountFiltering("notes.in=" + DEFAULT_NOTES + "," + UPDATED_NOTES, "notes.in=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllAccountsByNotesIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where notes is not null
        defaultAccountFiltering("notes.specified=true", "notes.specified=false");
    }

    @Test
    @Transactional
    void getAllAccountsByNotesContainsSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where notes contains
        defaultAccountFiltering("notes.contains=" + DEFAULT_NOTES, "notes.contains=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllAccountsByNotesNotContainsSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where notes does not contain
        defaultAccountFiltering("notes.doesNotContain=" + UPDATED_NOTES, "notes.doesNotContain=" + DEFAULT_NOTES);
    }

    @Test
    @Transactional
    void getAllAccountsByDeletedIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where deleted equals to
        defaultAccountFiltering("deleted.equals=" + DEFAULT_DELETED, "deleted.equals=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllAccountsByDeletedIsInShouldWork() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where deleted in
        defaultAccountFiltering("deleted.in=" + DEFAULT_DELETED + "," + UPDATED_DELETED, "deleted.in=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllAccountsByDeletedIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where deleted is not null
        defaultAccountFiltering("deleted.specified=true", "deleted.specified=false");
    }

    @Test
    @Transactional
    void getAllAccountsByCreatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where createdAt equals to
        defaultAccountFiltering("createdAt.equals=" + DEFAULT_CREATED_AT, "createdAt.equals=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllAccountsByCreatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where createdAt in
        defaultAccountFiltering("createdAt.in=" + DEFAULT_CREATED_AT + "," + UPDATED_CREATED_AT, "createdAt.in=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllAccountsByCreatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where createdAt is not null
        defaultAccountFiltering("createdAt.specified=true", "createdAt.specified=false");
    }

    @Test
    @Transactional
    void getAllAccountsByUpdatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where updatedAt equals to
        defaultAccountFiltering("updatedAt.equals=" + DEFAULT_UPDATED_AT, "updatedAt.equals=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllAccountsByUpdatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where updatedAt in
        defaultAccountFiltering("updatedAt.in=" + DEFAULT_UPDATED_AT + "," + UPDATED_UPDATED_AT, "updatedAt.in=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllAccountsByUpdatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        // Get all the accountList where updatedAt is not null
        defaultAccountFiltering("updatedAt.specified=true", "updatedAt.specified=false");
    }

    @Test
    @Transactional
    void getAllAccountsByBusinessIsEqualToSomething() throws Exception {
        Business business;
        if (TestUtil.findAll(em, Business.class).isEmpty()) {
            accountRepository.saveAndFlush(account);
            business = BusinessResourceIT.createEntity();
        } else {
            business = TestUtil.findAll(em, Business.class).get(0);
        }
        em.persist(business);
        em.flush();
        account.setBusiness(business);
        accountRepository.saveAndFlush(account);
        Long businessId = business.getId();
        // Get all the accountList where business equals to businessId
        defaultAccountShouldBeFound("businessId.equals=" + businessId);

        // Get all the accountList where business equals to (businessId + 1)
        defaultAccountShouldNotBeFound("businessId.equals=" + (businessId + 1));
    }

    private void defaultAccountFiltering(String shouldBeFound, String shouldNotBeFound) throws Exception {
        defaultAccountShouldBeFound(shouldBeFound);
        defaultAccountShouldNotBeFound(shouldNotBeFound);
    }

    /**
     * Executes the search, and checks that the default entity is returned.
     */
    private void defaultAccountShouldBeFound(String filter) throws Exception {
        restAccountMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(account.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)))
            .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE.toString())))
            .andExpect(jsonPath("$.[*].openingBalance").value(hasItem(sameNumber(DEFAULT_OPENING_BALANCE))))
            .andExpect(jsonPath("$.[*].accountNumber").value(hasItem(DEFAULT_ACCOUNT_NUMBER)))
            .andExpect(jsonPath("$.[*].ifsc").value(hasItem(DEFAULT_IFSC)))
            .andExpect(jsonPath("$.[*].upiId").value(hasItem(DEFAULT_UPI_ID)))
            .andExpect(jsonPath("$.[*].notes").value(hasItem(DEFAULT_NOTES)))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));

        // Check, that the count call also returns 1
        restAccountMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("1"));
    }

    /**
     * Executes the search, and checks that the default entity is not returned.
     */
    private void defaultAccountShouldNotBeFound(String filter) throws Exception {
        restAccountMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());

        // Check, that the count call also returns 0
        restAccountMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("0"));
    }

    @Test
    @Transactional
    void getNonExistingAccount() throws Exception {
        // Get the account
        restAccountMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingAccount() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the account
        Account updatedAccount = accountRepository.findById(account.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedAccount are not directly saved in db
        em.detach(updatedAccount);
        updatedAccount
            .name(UPDATED_NAME)
            .type(UPDATED_TYPE)
            .openingBalance(UPDATED_OPENING_BALANCE)
            .accountNumber(UPDATED_ACCOUNT_NUMBER)
            .ifsc(UPDATED_IFSC)
            .upiId(UPDATED_UPI_ID)
            .notes(UPDATED_NOTES)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
        AccountDTO accountDTO = accountMapper.toDto(updatedAccount);

        restAccountMockMvc
            .perform(
                put(ENTITY_API_URL_ID, accountDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(accountDTO))
            )
            .andExpect(status().isOk());

        // Validate the Account in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedAccountToMatchAllProperties(updatedAccount);
    }

    @Test
    @Transactional
    void putNonExistingAccount() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        account.setId(longCount.incrementAndGet());

        // Create the Account
        AccountDTO accountDTO = accountMapper.toDto(account);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restAccountMockMvc
            .perform(
                put(ENTITY_API_URL_ID, accountDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(accountDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Account in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchAccount() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        account.setId(longCount.incrementAndGet());

        // Create the Account
        AccountDTO accountDTO = accountMapper.toDto(account);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restAccountMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(accountDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Account in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamAccount() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        account.setId(longCount.incrementAndGet());

        // Create the Account
        AccountDTO accountDTO = accountMapper.toDto(account);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restAccountMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(accountDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Account in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateAccountWithPatch() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the account using partial update
        Account partialUpdatedAccount = new Account();
        partialUpdatedAccount.setId(account.getId());

        partialUpdatedAccount
            .name(UPDATED_NAME)
            .openingBalance(UPDATED_OPENING_BALANCE)
            .upiId(UPDATED_UPI_ID)
            .notes(UPDATED_NOTES)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);

        restAccountMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedAccount.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedAccount))
            )
            .andExpect(status().isOk());

        // Validate the Account in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertAccountUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedAccount, account), getPersistedAccount(account));
    }

    @Test
    @Transactional
    void fullUpdateAccountWithPatch() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the account using partial update
        Account partialUpdatedAccount = new Account();
        partialUpdatedAccount.setId(account.getId());

        partialUpdatedAccount
            .name(UPDATED_NAME)
            .type(UPDATED_TYPE)
            .openingBalance(UPDATED_OPENING_BALANCE)
            .accountNumber(UPDATED_ACCOUNT_NUMBER)
            .ifsc(UPDATED_IFSC)
            .upiId(UPDATED_UPI_ID)
            .notes(UPDATED_NOTES)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);

        restAccountMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedAccount.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedAccount))
            )
            .andExpect(status().isOk());

        // Validate the Account in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertAccountUpdatableFieldsEquals(partialUpdatedAccount, getPersistedAccount(partialUpdatedAccount));
    }

    @Test
    @Transactional
    void patchNonExistingAccount() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        account.setId(longCount.incrementAndGet());

        // Create the Account
        AccountDTO accountDTO = accountMapper.toDto(account);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restAccountMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, accountDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(accountDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Account in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchAccount() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        account.setId(longCount.incrementAndGet());

        // Create the Account
        AccountDTO accountDTO = accountMapper.toDto(account);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restAccountMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(accountDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Account in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamAccount() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        account.setId(longCount.incrementAndGet());

        // Create the Account
        AccountDTO accountDTO = accountMapper.toDto(account);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restAccountMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(accountDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Account in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteAccount() throws Exception {
        // Initialize the database
        insertedAccount = accountRepository.saveAndFlush(account);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the account
        restAccountMockMvc
            .perform(delete(ENTITY_API_URL_ID, account.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return accountRepository.count();
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

    protected Account getPersistedAccount(Account account) {
        return accountRepository.findById(account.getId()).orElseThrow();
    }

    protected void assertPersistedAccountToMatchAllProperties(Account expectedAccount) {
        assertAccountAllPropertiesEquals(expectedAccount, getPersistedAccount(expectedAccount));
    }

    protected void assertPersistedAccountToMatchUpdatableProperties(Account expectedAccount) {
        assertAccountAllUpdatablePropertiesEquals(expectedAccount, getPersistedAccount(expectedAccount));
    }
}
