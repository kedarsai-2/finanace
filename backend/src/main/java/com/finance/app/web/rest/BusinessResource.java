package com.finance.app.web.rest;

import com.finance.app.repository.BusinessRepository;
import com.finance.app.service.BusinessService;
import com.finance.app.service.dto.BusinessDTO;
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
 * REST controller for managing {@link com.finance.app.domain.Business}.
 */
@RestController
@RequestMapping("/api/businesses")
public class BusinessResource {

    private static final Logger LOG = LoggerFactory.getLogger(BusinessResource.class);

    private static final String ENTITY_NAME = "business";

    @Value("${jhipster.clientApp.name:backend}")
    private String applicationName;

    private final BusinessService businessService;

    private final BusinessRepository businessRepository;

    public BusinessResource(BusinessService businessService, BusinessRepository businessRepository) {
        this.businessService = businessService;
        this.businessRepository = businessRepository;
    }

    /**
     * {@code POST  /businesses} : Create a new business.
     *
     * @param businessDTO the businessDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new businessDTO, or with status {@code 400 (Bad Request)} if the business has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<BusinessDTO> createBusiness(@Valid @RequestBody BusinessDTO businessDTO) throws URISyntaxException {
        LOG.debug("REST request to save Business : {}", businessDTO);
        if (businessDTO.getId() != null) {
            throw new BadRequestAlertException("A new business cannot already have an ID", ENTITY_NAME, "idexists");
        }
        businessDTO = businessService.save(businessDTO);
        return ResponseEntity.created(new URI("/api/businesses/" + businessDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, businessDTO.getId().toString()))
            .body(businessDTO);
    }

    /**
     * {@code PUT  /businesses/:id} : Updates an existing business.
     *
     * @param id the id of the businessDTO to save.
     * @param businessDTO the businessDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated businessDTO,
     * or with status {@code 400 (Bad Request)} if the businessDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the businessDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<BusinessDTO> updateBusiness(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody BusinessDTO businessDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Business : {}, {}", id, businessDTO);
        if (businessDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, businessDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!businessRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        businessDTO = businessService.update(businessDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, businessDTO.getId().toString()))
            .body(businessDTO);
    }

    /**
     * {@code PATCH  /businesses/:id} : Partial updates given fields of an existing business, field will ignore if it is null
     *
     * @param id the id of the businessDTO to save.
     * @param businessDTO the businessDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated businessDTO,
     * or with status {@code 400 (Bad Request)} if the businessDTO is not valid,
     * or with status {@code 404 (Not Found)} if the businessDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the businessDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<BusinessDTO> partialUpdateBusiness(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody BusinessDTO businessDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Business partially : {}, {}", id, businessDTO);
        if (businessDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, businessDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!businessRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<BusinessDTO> result = businessService.partialUpdate(businessDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, businessDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /businesses} : get all the Businesses.
     *
     * @param pageable the pagination information.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of Businesses in body.
     */
    @GetMapping("")
    public ResponseEntity<List<BusinessDTO>> getAllBusinesses(@org.springdoc.core.annotations.ParameterObject Pageable pageable) {
        LOG.debug("REST request to get a page of Businesses");
        Page<BusinessDTO> page = businessService.findAll(pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /businesses/:id} : get the "id" business.
     *
     * @param id the id of the businessDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the businessDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<BusinessDTO> getBusiness(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Business : {}", id);
        Optional<BusinessDTO> businessDTO = businessService.findOne(id);
        return ResponseUtil.wrapOrNotFound(businessDTO);
    }

    /**
     * {@code DELETE  /businesses/:id} : delete the "id" business.
     *
     * @param id the id of the businessDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBusiness(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Business : {}", id);
        businessService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}
