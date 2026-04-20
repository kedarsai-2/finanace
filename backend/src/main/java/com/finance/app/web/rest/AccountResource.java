package com.finance.app.web.rest;

import com.finance.app.repository.AccountRepository;
import com.finance.app.service.AccountQueryService;
import com.finance.app.service.AccountService;
import com.finance.app.service.criteria.AccountCriteria;
import com.finance.app.service.dto.AccountDTO;
import com.finance.app.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.finance.app.domain.Account}.
 */
@RestController
@RequestMapping("/api/accounts")
public class AccountResource {

    private static final Logger LOG = LoggerFactory.getLogger(AccountResource.class);

    private static final String ENTITY_NAME = "account";

    @Value("${jhipster.clientApp.name:backend}")
    private String applicationName;

    private final AccountService accountService;

    private final AccountRepository accountRepository;

    private final AccountQueryService accountQueryService;

    public AccountResource(AccountService accountService, AccountRepository accountRepository, AccountQueryService accountQueryService) {
        this.accountService = accountService;
        this.accountRepository = accountRepository;
        this.accountQueryService = accountQueryService;
    }

    /**
     * {@code POST  /accounts} : Create a new account.
     *
     * @param accountDTO the accountDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new accountDTO, or with status {@code 400 (Bad Request)} if the account has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<AccountDTO> createAccount(@Valid @RequestBody AccountDTO accountDTO) throws URISyntaxException {
        LOG.debug("REST request to save Account : {}", accountDTO);
        if (accountDTO.getId() != null) {
            throw new BadRequestAlertException("A new account cannot already have an ID", ENTITY_NAME, "idexists");
        }
        accountDTO = accountService.save(accountDTO);
        return ResponseEntity.created(new URI("/api/accounts/" + accountDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, accountDTO.getId().toString()))
            .body(accountDTO);
    }

    /**
     * {@code PUT  /accounts/:id} : Updates an existing account.
     *
     * @param id the id of the accountDTO to save.
     * @param accountDTO the accountDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated accountDTO,
     * or with status {@code 400 (Bad Request)} if the accountDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the accountDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<AccountDTO> updateAccount(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody AccountDTO accountDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Account : {}, {}", id, accountDTO);
        if (accountDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, accountDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!accountRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        accountDTO = accountService.update(accountDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, accountDTO.getId().toString()))
            .body(accountDTO);
    }

    /**
     * {@code PATCH  /accounts/:id} : Partial updates given fields of an existing account, field will ignore if it is null
     *
     * @param id the id of the accountDTO to save.
     * @param accountDTO the accountDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated accountDTO,
     * or with status {@code 400 (Bad Request)} if the accountDTO is not valid,
     * or with status {@code 404 (Not Found)} if the accountDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the accountDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<AccountDTO> partialUpdateAccount(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody AccountDTO accountDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Account partially : {}, {}", id, accountDTO);
        if (accountDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, accountDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!accountRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<AccountDTO> result = accountService.partialUpdate(accountDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, accountDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /accounts} : get all the Accounts.
     *
     * @param pageable the pagination information.
     * @param criteria the criteria which the requested entities should match.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of Accounts in body.
     */
    @GetMapping("")
    public ResponseEntity<List<AccountDTO>> getAllAccounts(
        AccountCriteria criteria,
        @org.springdoc.core.annotations.ParameterObject Pageable pageable
    ) {
        LOG.debug("REST request to get Accounts by criteria: {}", criteria);

        Page<AccountDTO> page = accountQueryService.findByCriteria(criteria, pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /accounts/count} : count all the accounts.
     *
     * @param criteria the criteria which the requested entities should match.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the count in body.
     */
    @GetMapping("/count")
    public ResponseEntity<Long> countAccounts(AccountCriteria criteria) {
        LOG.debug("REST request to count Accounts by criteria: {}", criteria);
        return ResponseEntity.ok().body(accountQueryService.countByCriteria(criteria));
    }

    /**
     * {@code GET  /accounts/:id} : get the "id" account.
     *
     * @param id the id of the accountDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the accountDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<AccountDTO> getAccount(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Account : {}", id);
        Optional<AccountDTO> accountDTO = accountService.findOne(id);
        return ResponseUtil.wrapOrNotFound(accountDTO);
    }

    /**
     * {@code DELETE  /accounts/:id} : delete the "id" account.
     *
     * @param id the id of the accountDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Account : {}", id);
        accountService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}
